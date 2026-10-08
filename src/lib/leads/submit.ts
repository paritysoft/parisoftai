import { contactRequestSchema } from "@/lib/validation/lead";
import { sanitizeText } from "@/lib/leads/escape";

export const RATE_LIMIT = { bucket: "contact", windowMs: 10 * 60 * 1000, max: 5 };
export const MIN_FILL_MS = 2500;

export interface StoredLead {
  id: string;
  fullName: string;
  email: string;
  companyName: string | null;
  serviceRequired: string;
  estimatedBudget: string | null;
  preferredTimeline: string | null;
  projectDescription: string;
  createdAt: string;
}

export interface LeadDeps {
  /** Returns number of recent events for this key, after recording the current one. */
  hitRateLimit: (keyHash: string) => Promise<number>;
  /** Inserts the lead; returns `duplicate: true` if submissionId already exists. */
  insertLead: (lead: Omit<StoredLead, "id" | "createdAt"> & { submissionId: string; ipHash: string; consentGiven: boolean }) => Promise<{ lead: StoredLead; duplicate: boolean }>;
  notify: (lead: StoredLead) => Promise<"sent" | "skipped">;
  recordNotification: (leadId: string, result: { status: "sent" | "failed" | "skipped"; error?: string }) => Promise<void>;
  log?: (msg: string, meta?: Record<string, unknown>) => void;
}

export type SubmitResult =
  | { status: 200; body: { ok: true; message: string } }
  | { status: 400 | 403 | 413 | 429 | 500 | 503; body: { ok: false; message: string; fieldErrors?: Record<string, string> } };

const SUCCESS_MESSAGE = "Thanks — your inquiry has been received. We'll reply by email, usually within two business days.";

/**
 * Validates and stores a public contact submission. Pure orchestration — all I/O is injected,
 * which keeps it unit-testable. Success is returned only after the lead is durably stored.
 */
export async function submitLead(raw: unknown, ipHash: string, deps: LeadDeps): Promise<SubmitResult> {
  const parsed = contactRequestSchema.safeParse(raw);
  if (!parsed.success) {
    // Honeypot or timing fields failing validation indicate a bot: pretend success, store nothing.
    const issues = parsed.error.issues;
    if (issues.some((i) => i.path[0] === "website")) {
      deps.log?.("contact: honeypot triggered");
      return { status: 200, body: { ok: true, message: SUCCESS_MESSAGE } };
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: 400, body: { ok: false, message: "Please check the highlighted fields and try again.", fieldErrors } };
  }
  const data = parsed.data;

  if (data.elapsedMs < MIN_FILL_MS) {
    deps.log?.("contact: submitted too quickly", { elapsedMs: data.elapsedMs });
    return { status: 200, body: { ok: true, message: SUCCESS_MESSAGE } };
  }

  const recent = await deps.hitRateLimit(ipHash);
  if (recent > RATE_LIMIT.max) {
    return { status: 429, body: { ok: false, message: "Too many inquiries from your network. Please wait a few minutes and try again." } };
  }

  let stored: { lead: StoredLead; duplicate: boolean };
  try {
    stored = await deps.insertLead({
      submissionId: data.submissionId,
      fullName: sanitizeText(data.fullName),
      email: sanitizeText(data.email),
      companyName: sanitizeText(data.companyName) || null,
      serviceRequired: sanitizeText(data.serviceRequired),
      estimatedBudget: sanitizeText(data.estimatedBudget) || null,
      preferredTimeline: sanitizeText(data.preferredTimeline) || null,
      projectDescription: sanitizeText(data.projectDescription),
      consentGiven: data.consent,
      ipHash,
    });
  } catch (error) {
    deps.log?.("contact: failed to store lead", { error: String(error) });
    return { status: 500, body: { ok: false, message: "We couldn't save your inquiry due to a server problem. Please try again shortly." } };
  }

  // A retried request (same submissionId) must not create a second lead or a second email.
  if (stored.duplicate) return { status: 200, body: { ok: true, message: SUCCESS_MESSAGE } };

  try {
    const result = await deps.notify(stored.lead);
    await deps.recordNotification(stored.lead.id, { status: result });
  } catch (error) {
    // The lead is safely stored; record the failure so an admin can retry from the dashboard.
    deps.log?.("contact: notification failed", { leadId: stored.lead.id });
    await deps.recordNotification(stored.lead.id, { status: "failed", error: String(error).slice(0, 500) }).catch(() => {});
  }

  return { status: 200, body: { ok: true, message: SUCCESS_MESSAGE } };
}
