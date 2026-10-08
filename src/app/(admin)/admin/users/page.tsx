import { AdminPageHeader } from "@/components/admin/ui";
import { UsersManager } from "@/components/admin/users-manager";
import { requirePage } from "@/lib/auth/session";
import type { StaffRole } from "@/types/content";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const { supabase, user } = await requirePage("users.manage");
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, is_active, created_at").order("created_at"),
    supabase.from("admin_roles").select("role, description, rank").order("rank", { ascending: false }),
  ]);
  return (
    <>
      <AdminPageHeader title="Users" description="Who can access the admin panel and what they can do." />
      <UsersManager
        currentUserId={user.id}
        roles={(roles ?? []).map((r) => ({ role: r.role as StaffRole, description: r.description }))}
        users={(profiles ?? []).map((p) => ({ id: p.id, email: p.email, fullName: p.full_name, role: p.role, isActive: p.is_active, createdAt: p.created_at }))}
      />
    </>
  );
}
