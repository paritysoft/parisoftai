import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { serverEnv } from "@/lib/env";
import { isEmailDeliveryConfigured, sendLeadNotification } from "@/lib/leads/email";
import { RATE_LIMIT, type LeadDeps, type StoredLead } from "@/lib/leads/submit";
import type { NotificationSettings } from "@/types/content";

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${serverEnv.rateLimitSalt || "psai"}:${ip}`).digest("hex");
}

export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toStored(r: any): StoredLead {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    companyName: r.company_name,
    serviceRequired: r.service_required,
    estimatedBudget: r.estimated_budget,
    preferredTimeline: r.preferred_timeline,
    projectDescription: r.project_description,
    createdAt: r.created_at,
  };
}

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const db = createServiceClient();
  const { data } = await db.from("site_settings").select("value").eq("key", "notifications").maybeSingle();
  const v = (data?.value ?? {}) as Partial<NotificationSettings>;
  return { enabled: v.enabled !== false, recipients: Array.isArray(v.recipients) ? v.recipients.filter((r) => typeof r === "string") : [] };
}

export function createLeadDeps(): LeadDeps {
  const db = createServiceClient();
  return {
    async hitRateLimit(keyHash) {
      const since = new Date(Date.now() - RATE_LIMIT.windowMs).toISOString();
      await db.from("rate_limit_events").insert({ bucket: RATE_LIMIT.bucket, key_hash: keyHash });
      const { count } = await db
        .from("rate_limit_events")
        .select("id", { count: "exact", head: true })
        .eq("bucket", RATE_LIMIT.bucket)
        .eq("key_hash", keyHash)
        .gte("created_at", since);
      // Opportunistic cleanup of old events
      if (Math.random() < 0.05) {
        await db.from("rate_limit_events").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
      }
      return count ?? 0;
    },
    async insertLead(input) {
      const { data, error } = await db
        .from("leads")
        .insert({
          submission_id: input.submissionId,
          full_name: input.fullName,
          email: input.email,
          company_name: input.companyName,
          service_required: input.serviceRequired,
          estimated_budget: input.estimatedBudget,
          preferred_timeline: input.preferredTimeline,
          project_description: input.projectDescription,
          consent_given: input.consentGiven,
          ip_hash: input.ipHash,
        })
        .select("*")
        .single();
      if (error) {
        if (error.code === "23505") {
          const { data: existing } = await db.from("leads").select("*").eq("submission_id", input.submissionId).single();
          return { lead: toStored(existing), duplicate: true };
        }
        throw new Error(error.message);
      }
      return { lead: toStored(data), duplicate: false };
    },
    async notify(lead) {
      const settings = await loadNotificationSettings();
      if (!settings.enabled) return "skipped";
      return sendLeadNotification(lead, settings.recipients);
    },
    async recordNotification(leadId, result) {
      const patch: Record<string, unknown> = { notification_status: result.status, notification_error: result.error ?? null };
      if (result.status === "sent") patch.notified_at = new Date().toISOString();
      const { data } = await db.from("leads").select("notification_attempts").eq("id", leadId).single();
      patch.notification_attempts = (data?.notification_attempts ?? 0) + (result.status === "skipped" ? 0 : 1);
      await db.from("leads").update(patch).eq("id", leadId);
    },
    log: (msg, meta) => console.warn(`[contact] ${msg}`, meta ?? ""),
  };
}

/* ------------------------- Email-only (no database) ------------------------ */

export type ContactDelivery = "database" | "email" | "none";

/** How contact inquiries are delivered: stored in Supabase, emailed via Resend, or not at all. */
export function contactDelivery(): ContactDelivery {
  if (serverEnv.supabaseUrl && serverEnv.supabasePublishableKey && serverEnv.supabaseSecretKey) return "database";
  if (isEmailDeliveryConfigured()) return "email";
  return "none";
}

const recentHits = new Map<string, number[]>();
const seenSubmissions = new Map<string, StoredLead>();

/**
 * Delivers inquiries by email only. Rate limiting and duplicate detection are in-memory
 * (per server instance) — adequate for a low-volume contact form; Supabase adds durable storage.
 */
export function createEmailOnlyDeps(): LeadDeps {
  return {
    notificationRequired: true,
    async hitRateLimit(keyHash) {
      const now = Date.now();
      const hits = (recentHits.get(keyHash) ?? []).filter((t) => t > now - RATE_LIMIT.windowMs);
      hits.push(now);
      recentHits.set(keyHash, hits);
      if (recentHits.size > 5000) recentHits.clear();
      return hits.length;
    },
    async insertLead(input) {
      const existing = seenSubmissions.get(input.submissionId);
      if (existing) return { lead: existing, duplicate: true };
      const lead: StoredLead = {
        id: randomUUID(),
        fullName: input.fullName,
        email: input.email,
        companyName: input.companyName,
        serviceRequired: input.serviceRequired,
        estimatedBudget: input.estimatedBudget,
        preferredTimeline: input.preferredTimeline,
        projectDescription: input.projectDescription,
        createdAt: new Date().toISOString(),
      };
      if (seenSubmissions.size > 2000) seenSubmissions.clear();
      seenSubmissions.set(input.submissionId, lead);
      return { lead, duplicate: false };
    },
    notify: (lead) => sendLeadNotification(lead, [], { adminLink: false }),
    async recordNotification() {},
    forget: (id) => void seenSubmissions.delete(id),
    log: (msg, meta) => console.warn(`[contact] ${msg}`, meta ?? ""),
  };
}
