import "server-only";
import type { ActionContext } from "@/lib/auth/actions";

/** Append an entry to the audit log. Never pass secrets or personal data in the summary. */
export async function audit(ctx: ActionContext, action: string, resourceType: string, resourceId: string | null, summary?: string) {
  const { error } = await ctx.supabase.from("audit_logs").insert({
    actor_id: ctx.user.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    summary: summary?.slice(0, 500) ?? null,
  });
  if (error) console.error("[audit] failed to write entry", error.message);
}
