import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/auth-forms";
import { getSession } from "@/lib/auth/session";
import { safeAdminNext } from "@/lib/auth/safe-next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  "no-access": "This account does not have admin access. Ask a super admin to grant it.",
  link: "That sign-in link is invalid or has expired. Request a new one.",
  unconfigured: "Supabase is not configured. Add the environment variables described in .env.example.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const session = await getSession();
  if (session.kind === "staff") redirect(safeAdminNext(typeof sp.next === "string" ? sp.next : undefined));
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : session.kind === "unconfigured" ? ERRORS.unconfigured : undefined;
  return (
    <AuthCard title="Sign in to admin" description="ParitySoft AI content management">
      <LoginForm next={typeof sp.next === "string" ? sp.next : undefined} initialError={error} />
    </AuthCard>
  );
}
