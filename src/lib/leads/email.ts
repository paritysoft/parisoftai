import "server-only";
import { serverEnv } from "@/lib/env";
import { escapeHtml } from "@/lib/leads/escape";
import { absoluteUrl } from "@/lib/site";
import type { StoredLead } from "@/lib/leads/submit";

/**
 * Sends an admin notification through Resend's HTTP API (no SDK dependency).
 * Returns "skipped" when email is not configured or notifications are disabled.
 */
export function isEmailDeliveryConfigured(): boolean {
  return Boolean(serverEnv.resendApiKey && serverEnv.contactFromEmail && serverEnv.contactNotificationEmail.split(",").some((s) => s.trim()));
}

export async function sendLeadNotification(lead: StoredLead, recipients: string[], opts: { adminLink?: boolean } = {}): Promise<"sent" | "skipped"> {
  const adminLink = opts.adminLink !== false;
  const to = recipients.length > 0 ? recipients : serverEnv.contactNotificationEmail.split(",").map((s) => s.trim()).filter(Boolean);
  if (!serverEnv.resendApiKey || !serverEnv.contactFromEmail || to.length === 0) return "skipped";

  const rows: [string, string | null][] = [
    ["Name", lead.fullName],
    ["Email", lead.email],
    ["Company", lead.companyName],
    ["Service", lead.serviceRequired],
    ["Budget", lead.estimatedBudget],
    ["Timeline", lead.preferredTimeline],
  ];
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;color:#0f172a">
      <h2 style="margin:0 0 16px">New project inquiry</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        ${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td style="color:#64748b">${k}</td><td><strong>${escapeHtml(v!)}</strong></td></tr>`)
          .join("")}
      </table>
      <h3 style="margin:20px 0 8px">Project description</h3>
      <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(lead.projectDescription)}</p>
      ${adminLink ? `<p style="margin-top:24px"><a href="${absoluteUrl(`/admin/leads/${lead.id}`)}">Open in admin</a></p>` : `<p style="margin-top:24px;color:#64748b">Reply to this email to answer ${escapeHtml(lead.fullName)} directly.</p>`}
    </div>`;
  const text = `New project inquiry\n\n${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}\n\n${lead.projectDescription}${adminLink ? `\n\n${absoluteUrl(`/admin/leads/${lead.id}`)}` : ""}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${serverEnv.resendApiKey}`, "Content-Type": "application/json", "Idempotency-Key": `lead-${lead.id}` },
    body: JSON.stringify({
      from: serverEnv.contactFromEmail,
      to,
      reply_to: lead.email,
      subject: `New inquiry: ${lead.serviceRequired} — ${lead.fullName}`.replace(/[\r\n]+/g, " ").slice(0, 200),
      html,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 200)}`);
  }
  return "sent";
}
