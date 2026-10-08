import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@/types/content";

export interface StaffUser {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
}

export type SessionState =
  | { kind: "unconfigured" }
  | { kind: "anonymous" }
  | { kind: "no-access"; email: string }
  | { kind: "staff"; user: StaffUser; supabase: SupabaseClient };

/**
 * Resolves the signed-in user and their staff role. Uses auth.getUser(), which validates the
 * session with Supabase Auth (not just the cookie), so revoked sessions are rejected.
 */
export const getSession = cache(async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) return { kind: "unconfigured" };
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "anonymous" };
  const { data: profile } = await supabase.from("profiles").select("id, email, full_name, role, is_active").eq("id", user.id).maybeSingle();
  if (!profile?.role || !profile.is_active) return { kind: "no-access", email: user.email ?? "" };
  return {
    kind: "staff",
    supabase,
    user: { id: user.id, email: profile.email || user.email || "", fullName: profile.full_name, role: profile.role as StaffRole },
  };
});

/** For admin pages: redirect to login when signed out; show a denied state when the role is insufficient. */
export async function requirePage(permission: Permission = "dashboard.view") {
  const session = await getSession();
  if (session.kind === "unconfigured") redirect("/admin/login?error=unconfigured");
  if (session.kind === "anonymous") redirect("/admin/login");
  if (session.kind === "no-access") redirect("/admin/login?error=no-access");
  if (!can(session.user.role, permission)) redirect("/admin?denied=1");
  return session;
}
