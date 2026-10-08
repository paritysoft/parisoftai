import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionTable } from "@/components/admin/collection-table";
import { buttonClasses } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PLATFORM_LABELS, type Platform } from "@/types/content";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const { supabase, user } = await requirePage("content.edit");
  const { data } = await supabase.from("products").select("id, name, slug, status, featured, platforms, updated_at").order("sort_order").order("name");
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Company-owned apps shown on /products."
        actions={
          <Link href="/admin/products/new" className={buttonClasses("primary", "sm")}>
            <Plus className="size-4" aria-hidden="true" /> Add product
          </Link>
        }
      />
      <CollectionTable
        collection="products"
        basePath="/admin/products"
        canReorder={can(user.role, "content.publish")}
        emptyText="No products yet. Add your first app to show it on the website."
        rows={(data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          status: r.status,
          featured: r.featured,
          meta: (r.platforms as Platform[]).map((p) => PLATFORM_LABELS[p]).join(", "),
          updatedAt: r.updated_at,
        }))}
      />
    </>
  );
}
