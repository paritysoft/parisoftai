import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { isWriteBlocked } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requirePage();
  let unread = 0;
  if (can(user.role, "leads.view")) {
    const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_read", false);
    unread = count ?? 0;
  }
  return (
    <AdminShell user={{ email: user.email, fullName: user.fullName, role: user.role }} unreadLeads={unread} writeBlocked={isWriteBlocked()}>
      {children}
    </AdminShell>
  );
}
