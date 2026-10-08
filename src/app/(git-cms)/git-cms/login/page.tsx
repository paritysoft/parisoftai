import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { CmsLoginForm } from "@/components/cms/login-form";
import { isGitAdminConfigured } from "@/lib/cms/config";
import { getCmsSession } from "@/lib/cms/session";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function CmsLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isGitAdminConfigured()) {
    return (
      <AuthCard title="Admin is not configured" description="ParitySoft AI content management">
        <div className="space-y-3 text-sm leading-relaxed text-fg-2">
          <p>Sign-in is disabled until the server has admin credentials. Nothing on the public website is affected.</p>
          <p className="text-fg-3">
            Set <code className="font-mono text-xs">ADMIN_EMAIL</code>, <code className="font-mono text-xs">ADMIN_PASSWORD_HASH</code> and{" "}
            <code className="font-mono text-xs">ADMIN_SESSION_SECRET</code> in your Vercel project, then redeploy. See docs/CONTENT_PUBLISHING.md.
          </p>
        </div>
      </AuthCard>
    );
  }
  if (await getCmsSession()) redirect("/admin");
  const sp = await searchParams;
  return (
    <AuthCard title="Sign in to admin" description="ParitySoft AI content management">
      <CmsLoginForm next={typeof sp.next === "string" ? sp.next : undefined} />
    </AuthCard>
  );
}
