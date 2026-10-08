"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, dbError, withPermission, type ActionResult } from "@/lib/auth/actions";
import { audit } from "@/lib/audit";
import { isServiceRoleConfigured } from "@/lib/env";
import { sendLeadNotification } from "@/lib/leads/email";
import { loadNotificationSettings } from "@/lib/leads/server-deps";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/types/content";

const uuid = z.uuid();

export async function updateLeadAction(id: string, input: { status?: string; assignedTo?: string | null; isRead?: boolean }): Promise<ActionResult> {
  return withPermission("leads.manage", async (ctx) => {
    if (!uuid.safeParse(id).success) throw new ActionError("Invalid lead.");
    const parsed = z
      .object({ status: z.enum(LEAD_STATUSES).optional(), assignedTo: uuid.nullable().optional(), isRead: z.boolean().optional() })
      .safeParse(input);
    if (!parsed.success) throw new ActionError("Invalid update.");
    const patch: Record<string, unknown> = {};
    if (parsed.data.status) patch.status = parsed.data.status;
    if (parsed.data.assignedTo !== undefined) patch.assigned_to = parsed.data.assignedTo;
    if (parsed.data.isRead !== undefined) patch.is_read = parsed.data.isRead;
    const { data: before } = await ctx.supabase.from("leads").select("status").eq("id", id).maybeSingle();
    const { error } = await ctx.supabase.from("leads").update(patch).eq("id", id);
    if (error) dbError(error, "lead");
    if (parsed.data.status && before?.status !== parsed.data.status) {
      await audit(ctx, "lead.status_change", "lead", id, `Status: ${LEAD_STATUS_LABELS[before?.status as keyof typeof LEAD_STATUS_LABELS] ?? "?"} → ${LEAD_STATUS_LABELS[parsed.data.status]}`);
    }
    if (parsed.data.assignedTo !== undefined) await audit(ctx, "lead.assign", "lead", id, parsed.data.assignedTo ? "Assigned lead" : "Unassigned lead");
    revalidatePath("/admin/leads");
    return { ok: true, message: "Lead updated." };
  });
}

export async function addLeadNoteAction(id: string, body: string): Promise<ActionResult> {
  return withPermission("leads.manage", async (ctx) => {
    const text = z.string().trim().min(1, "Write a note first.").max(4000).safeParse(body);
    if (!text.success) throw new ActionError(text.error.issues[0]?.message ?? "Invalid note.");
    const { error } = await ctx.supabase.from("lead_notes").insert({ lead_id: id, body: text.data, author_id: ctx.user.id });
    if (error) dbError(error, "note");
    await audit(ctx, "lead.note", "lead", id, "Added internal note");
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true, message: "Note added." };
  });
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  return withPermission("leads.delete", async (ctx) => {
    const { data, error } = await ctx.supabase.from("leads").delete().eq("id", id).select("id");
    if (error) dbError(error, "lead");
    if (!data?.length) throw new ActionError("Lead not found.");
    await audit(ctx, "lead.delete", "lead", id, "Deleted lead");
    revalidatePath("/admin/leads");
    return { ok: true, message: "Lead deleted." };
  });
}

/** Retries a failed/skipped admin email notification without creating a new lead. */
export async function retryLeadNotificationAction(id: string): Promise<ActionResult> {
  return withPermission("leads.manage", async (ctx) => {
    if (!isServiceRoleConfigured()) throw new ActionError("Email notifications need SUPABASE_SECRET_KEY to load notification settings.");
    const { data: r } = await ctx.supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (!r) throw new ActionError("Lead not found.");
    const settings = await loadNotificationSettings();
    let status: "sent" | "skipped" | "failed";
    let errorText: string | null = null;
    try {
      status = await sendLeadNotification(
        {
          id: r.id,
          fullName: r.full_name,
          email: r.email,
          companyName: r.company_name,
          serviceRequired: r.service_required,
          estimatedBudget: r.estimated_budget,
          preferredTimeline: r.preferred_timeline,
          projectDescription: r.project_description,
          createdAt: r.created_at,
        },
        settings.recipients,
      );
    } catch (e) {
      status = "failed";
      errorText = String(e).slice(0, 500);
    }
    await ctx.supabase
      .from("leads")
      .update({ notification_status: status, notification_error: errorText, notification_attempts: (r.notification_attempts ?? 0) + 1, ...(status === "sent" ? { notified_at: new Date().toISOString() } : {}) })
      .eq("id", id);
    await audit(ctx, "lead.notify_retry", "lead", id, `Notification retry: ${status}`);
    revalidatePath(`/admin/leads/${id}`);
    if (status === "failed") return { ok: false, error: "Email still failed. Check RESEND_API_KEY, CONTACT_FROM_EMAIL and the sending domain." };
    if (status === "skipped") return { ok: false, error: "Email is not configured (no API key, sender or recipients)." };
    return { ok: true, message: "Notification sent." };
  });
}

/** Deletes leads older than the configured retention period. */
export async function purgeOldLeadsAction(): Promise<ActionResult<{ deleted: number }>> {
  return withPermission("settings.manage", async (ctx) => {
    const { data: s } = await ctx.supabase.from("site_settings").select("value").eq("key", "contact_form").maybeSingle();
    const days = Number((s?.value as { retentionDays?: number } | null)?.retentionDays ?? 730);
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await ctx.supabase.from("leads").delete().lt("created_at", cutoff).select("id");
    if (error) dbError(error, "leads");
    const deleted = data?.length ?? 0;
    await audit(ctx, "lead.retention_purge", "lead", null, `Deleted ${deleted} leads older than ${days} days`);
    return { ok: true, message: `Deleted ${deleted} lead(s) older than ${days} days.`, data: { deleted } };
  });
}
