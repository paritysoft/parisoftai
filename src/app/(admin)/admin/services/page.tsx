import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionTable } from "@/components/admin/collection-table";
import { buttonClasses } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";

export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const { supabase, user } = await requirePage("content.edit");
  const { data } = await supabase.from("services").select("id, title, slug, status, technologies, updated_at").order("sort_order").order("title");
  return (
    <>
      <AdminPageHeader
        title="Services"
        description="Service cards on the homepage and the /services pages."
        actions={
          <Link href="/admin/services/new" className={buttonClasses("primary", "sm")}>
            <Plus className="size-4" aria-hidden="true" /> New service
          </Link>
        }
      />
      <CollectionTable
        collection="services"
        basePath="/admin/services"
        canReorder={can(user.role, "content.publish")}
        emptyText="No services yet."
        rows={(data ?? []).map((r) => ({ id: r.id, name: r.title, slug: r.slug, status: r.status, meta: `${(r.technologies ?? []).length} technologies`, updatedAt: r.updated_at }))}
      />
    </>
  );
}
