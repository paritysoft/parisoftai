import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { SeoManager, type SeoPathRow } from "@/components/admin/seo-manager";
import { requirePage } from "@/lib/auth/session";
import { mapSeo } from "@/lib/content/mappers";

export const metadata = { title: "SEO" };

export default async function SeoPage() {
  const { supabase } = await requirePage("seo.manage");
  const [{ data: services }, { data: projects }, { data: products }, { data: overrides }] = await Promise.all([
    supabase.from("services").select("slug, title, status").order("sort_order"),
    supabase.from("portfolio_projects").select("slug, title, status").order("sort_order"),
    supabase.from("products").select("slug, name, status").order("sort_order"),
    supabase.from("seo_metadata").select("*"),
  ]);
  const paths: SeoPathRow[] = [
    { path: "/", label: "Home", published: true },
    { path: "/services", label: "Services", published: true },
    ...(services ?? []).map((s) => ({ path: `/services/${s.slug}`, label: s.title, published: s.status === "published" })),
    { path: "/work", label: "Our Work", published: true },
    ...(projects ?? []).map((p) => ({ path: `/work/${p.slug}`, label: p.title, published: p.status === "published" })),
    { path: "/products", label: "Products", published: true },
    ...(products ?? []).map((p) => ({ path: `/products/${p.slug}`, label: p.name, published: p.status === "published" })),
    { path: "/about", label: "About", published: true },
    { path: "/contact", label: "Contact", published: true },
    { path: "/privacy", label: "Privacy Policy", published: true },
    { path: "/terms", label: "Terms", published: true },
  ];
  return (
    <>
      <AdminPageHeader
        title="SEO"
        description="Per-page search and social metadata. The sitemap and robots.txt are generated automatically; admin pages are always noindex."
        actions={
          <>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-200 hover:text-white">
              View sitemap
            </a>
            <Link href="/admin/settings#seo" className="text-sm text-indigo-200 hover:text-white">
              Default metadata
            </Link>
          </>
        }
      />
      <SeoManager paths={paths} overrides={(overrides ?? []).map(mapSeo)} />
    </>
  );
}
