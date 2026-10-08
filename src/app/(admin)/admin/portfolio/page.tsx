import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionTable } from "@/components/admin/collection-table";
import { buttonClasses } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";

export const metadata = { title: "Portfolio" };

export default async function AdminPortfolioPage() {
  const { supabase, user } = await requirePage("content.edit");
  const { data } = await supabase.from("portfolio_projects").select("id, title, slug, status, featured, ownership, category, updated_at").order("sort_order").order("created_at", { ascending: false });
  return (
    <>
      <AdminPageHeader
        title="Portfolio"
        description="Case studies shown on /work. Client projects and company-owned products are labeled separately."
        actions={
          <Link href="/admin/portfolio/new" className={buttonClasses("primary", "sm")}>
            <Plus className="size-4" aria-hidden="true" /> Add project
          </Link>
        }
      />
      <CollectionTable
        collection="portfolio"
        basePath="/admin/portfolio"
        canReorder={can(user.role, "content.publish")}
        emptyText="No projects yet. Add verified work you have permission to show."
        rows={(data ?? []).map((r) => ({ id: r.id, name: r.title, slug: r.slug, status: r.status, featured: r.featured, meta: `${r.category} · ${r.ownership === "company" ? "Company" : "Client"}`, updatedAt: r.updated_at }))}
      />
    </>
  );
}
