import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui";
import { CollectionTable } from "@/components/admin/collection-table";
import { buttonClasses } from "@/components/ui/button";
import { loadAdminItems } from "@/lib/cms/data";
import type { StoredProject } from "@/lib/content/file-format";

export const metadata = { title: "Projects" };

export default async function CmsProjectsPage() {
  const { items: all, error } = await loadAdminItems("projects");
  const items = all as StoredProject[];
  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Portfolio items shown on /work. Client projects need the client's permission before publishing."
        actions={
          <Link href="/admin/projects/new" className={buttonClasses("primary", "sm")}>
            <Plus className="size-4" aria-hidden="true" /> Add project
          </Link>
        }
      />
      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
          Could not load from GitHub: {error}
        </p>
      ) : null}
      <CollectionTable
        collection="portfolio"
        basePath="/admin/projects"
        canReorder={false}
        emptyText="No projects yet. Add one — it stays private until you publish it."
        rows={items.map((i) => ({ id: i.id, name: i.title, slug: i.slug, status: i.status, featured: i.featured, meta: `${i.category} · ${i.ownership === "company" ? "Company product" : "Client project"}`, updatedAt: i.updatedAt }))}
      />
    </>
  );
}
