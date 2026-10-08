import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { ForgotPasswordForm } from "@/components/admin/auth-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" description="We'll email you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
