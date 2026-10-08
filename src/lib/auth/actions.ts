import "server-only";
import { isWriteBlocked } from "@/lib/env";
import { can, type Permission } from "@/lib/permissions";
import { getSession, type StaffUser } from "@/lib/auth/session";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export interface ActionContext {
  user: StaffUser;
  supabase: SupabaseClient;
}

export class ActionError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

const READ_ONLY: Permission[] = ["dashboard.view", "leads.view", "analytics.view", "audit.view"];

/**
 * Every Server Action goes through this wrapper: it re-checks the session and role on the
 * server (Server Actions are public HTTP endpoints), blocks writes from non-production
 * deployments pointed at production data, and converts thrown errors into safe messages.
 */
export async function withPermission<T>(permission: Permission, fn: (ctx: ActionContext) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const session = await getSession();
  if (session.kind !== "staff") return { ok: false, error: "Your session has expired. Please sign in again." };
  if (!can(session.user.role, permission)) return { ok: false, error: "You don't have permission to do that." };
  if (!READ_ONLY.includes(permission) && isWriteBlocked()) {
    return { ok: false, error: "Writes are disabled: this deployment is connected to the production database but is not the production deployment." };
  }
  try {
    return await fn({ user: session.user, supabase: session.supabase });
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    console.error("[admin action]", error);
    return { ok: false, error: "Something went wrong while saving. Please try again." };
  }
}

/** Translate common Postgres errors into helpful messages. */
export function dbError(error: { code?: string; message: string } | null, what = "record"): never {
  if (!error) throw new ActionError(`Could not save ${what}.`);
  if (error.code === "23505") throw new ActionError(`That slug or key is already in use. Choose a different one.`, { slug: "Already in use" });
  if (error.code === "42501" || /row-level security/i.test(error.message)) throw new ActionError("You don't have permission to change this item.");
  if (error.code === "23514") throw new ActionError(`Some values are not allowed (${what}). Check lengths and URL formats.`);
  console.error("[db]", error);
  throw new ActionError(`Could not save ${what}.`);
}
