"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { safeAdminNext } from "@/lib/auth/safe-next";
import { absoluteUrl } from "@/lib/site";

export type AuthFormState = { error?: string; message?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured. Add the environment variables described in .env.example." };
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email address and password." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    // Generic message: never reveal whether the account exists
    return { error: "Incorrect email or password." };
  }
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.role || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This account does not have admin access. Ask a super admin to grant it." };
  }
  await supabase.from("audit_logs").insert({ actor_id: data.user.id, action: "auth.sign_in", resource_type: "session", resource_id: null, summary: "Signed in" });
  redirect(safeAdminNext(formData.get("next")?.toString()));
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("audit_logs").insert({ actor_id: data.user.id, action: "auth.sign_out", resource_type: "session", resource_id: null, summary: "Signed out" });
    }
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export async function requestPasswordResetAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address." };
  const supabase = await createSessionClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: absoluteUrl("/auth/confirm?next=/admin/account/password"),
  });
  return { message: "If an admin account exists for that email, a reset link is on its way." };
}

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match.", path: ["confirm"] });

export async function updatePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your link has expired. Request a new password reset." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message.includes("different") ? "Choose a password you haven't used before." : "Could not update your password." };
  await supabase.from("audit_logs").insert({ actor_id: data.user.id, action: "auth.password_changed", resource_type: "user", resource_id: data.user.id, summary: "Password changed" });
  redirect("/admin");
}
