import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { SetPasswordForm } from "@/components/admin/auth-forms";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set password", robots: { index: false, follow: false } };

export default async function SetPasswordPage() {
  const session = await getSession();
  if (session.kind === "anonymous" || session.kind === "unconfigured") redirect("/admin/login?error=link");
  return (
    <AuthCard title="Choose a password" description="You'll use this with your email to sign in.">
      <SetPasswordForm />
    </AuthCard>
  );
}
