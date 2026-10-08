import type { MetadataRoute } from "next";
import { getSeoOverrides, listProducts, listProjects, listServices } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

const latest = (dates: (string | null | undefined)[]) => dates.filter((d): d is string => Boolean(d) && !Number.isNaN(Date.parse(d!))).sort().at(-1);

/**
 * Only published, indexable public pages. Admin, API, drafts and archived content are never listed.
 * lastModified is emitted only where a real date exists (content items), never invented.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, products, overrides] = await Promise.all([listServices(), listProjects(), listProducts(), getSeoOverrides()]);
  const entries: { path: string; lastModified?: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/services", priority: 0.9, lastModified: latest(services.map((s) => s.updatedAt)) },
    ...services.map((s) => ({ path: `/services/${s.slug}`, lastModified: s.updatedAt || undefined, priority: 0.8 })),
    { path: "/work", priority: 0.7, lastModified: latest(projects.map((p) => p.updatedAt)) },
    ...projects.map((p) => ({ path: `/work/${p.slug}`, lastModified: p.updatedAt || undefined, priority: 0.7 })),
    { path: "/products", priority: 0.7, lastModified: latest(products.map((p) => p.updatedAt)) },
    ...products.map((p) => ({ path: `/products/${p.slug}`, lastModified: p.updatedAt || undefined, priority: 0.7 })),
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
  ];
  return entries
    .filter((e) => e.path && !overrides.get(e.path)?.noindex)
    .map((e) => ({ url: absoluteUrl(e.path), lastModified: e.lastModified ? new Date(e.lastModified) : undefined, priority: e.priority }));
}
