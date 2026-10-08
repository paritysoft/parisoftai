import "server-only";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { serverEnv } from "@/lib/env";
import { sendLeadNotification } from "@/lib/leads/email";
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
