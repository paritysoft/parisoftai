import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionTable } from "@/components/admin/collection-table";
import { buttonClasses } from "@/components/ui/button";
import { loadAdminItems } from "@/lib/cms/data";
import type { StoredProduct } from "@/lib/content/file-format";

export const metadata = { title: "Products" };

export default async function CmsProductsPage() {
  const { items: all, error } = await loadAdminItems("products");
  const items = all as StoredProduct[];
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Your own software products shown on /products."
        actions={
          <Link href="/admin/products/new" className={buttonClasses("primary", "sm")}>
            <Plus className="size-4" aria-hidden="true" /> Add product
          </Link>
        }
      />
      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
          Could not load from GitHub: {error}
        </p>
      ) : null}
      <CollectionTable
        collection="products"
        basePath="/admin/products"
        canReorder={false}
        emptyText="No products yet. Add one — it stays private until you publish it."
        rows={items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, status: i.status, featured: i.featured, meta: i.categories.join(", "), updatedAt: i.updatedAt }))}
      />
    </>
  );
}
