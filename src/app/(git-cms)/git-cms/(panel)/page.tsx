import Link from "next/link";
import { AlertTriangle, GitCommitHorizontal, Plus } from "lucide-react";
import { AdminPageHeader, Card, StatCard } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { loadAdminItems, publishStatus } from "@/lib/cms/data";

export const metadata = { title: "Dashboard" };

const count = (items: { status: string }[], s: string) => items.filter((i) => i.status === s).length;

export default async function CmsDashboard() {
  const [projects, products] = await Promise.all([loadAdminItems("projects"), loadAdminItems("products")]);
  const status = publishStatus();
  const errors = [projects.error, products.error].filter(Boolean);
  const invalid = [...projects.invalid, ...products.invalid];
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Manage the projects and products shown on parisoftai.com."
        actions={
          <>
            <Link href="/admin/projects/new" className={buttonClasses("secondary", "sm")}>
              <Plus className="size-4" aria-hidden="true" /> Add project
            </Link>
            <Link href="/admin/products/new" className={buttonClasses("primary", "sm")}>
              <Plus className="size-4" aria-hidden="true" /> Add product
            </Link>
          </>
        }
      />
      {errors.length > 0 ? (
        <div role="alert" className="mb-6 flex gap-3 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Could not read content from GitHub.</p>
            <p className="mt-1 text-red-100/80">{errors[0]}</p>
          </div>
        </div>
      ) : null}
      {invalid.length > 0 ? (
        <div role="alert" className="mb-6 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
          <p className="font-medium">Some content files are invalid and will fail the next deployment:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100/85">
            {invalid.map((i) => (
              <li key={i.path}>
                <code className="font-mono text-xs">{i.path}</code> — {i.error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published projects" value={count(projects.items, "published")} hint={`${count(projects.items, "draft")} draft · ${count(projects.items, "archived")} archived`} href="/admin/projects" />
        <StatCard label="Published products" value={count(products.items, "published")} hint={`${count(products.items, "draft")} draft · ${count(products.items, "archived")} archived`} href="/admin/products" />
        <StatCard label="Featured on homepage" value={[...projects.items, ...products.items].filter((i) => i.status === "published" && i.featured).length} hint="Published + featured items" />
        <StatCard label="Publishing" value={status.target === "github" ? "GitHub" : status.target === "filesystem" ? "Local" : "Off"} hint={status.target === "github" ? `${status.repo} · ${status.branch}` : undefined} />
      </div>
      <Card title="How publishing works" className="mt-8">
        <div className="flex gap-3 text-sm leading-relaxed text-fg-2">
          <GitCommitHorizontal className="mt-0.5 size-5 shrink-0 text-indigo-300" aria-hidden="true" />
          <div className="space-y-2">
            <p>{status.note}</p>
            <p className="text-fg-3">
              Only <strong className="text-fg-2">Published</strong> items appear on the website, in listings and in the sitemap. Drafts and archived items stay private. Featured
              published items also appear on the homepage. If a published item&apos;s slug changes, the old URL redirects to the new one automatically.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
