import type { MetadataRoute } from "next";
import { getSeoOverrides, listProducts, listProjects, listServices } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

/** Only published, indexable public pages. Admin, API and draft content are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, products, overrides] = await Promise.all([listServices(), listProjects(), listProducts(), getSeoOverrides()]);
  const entries: { path: string; lastModified?: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/services", priority: 0.9 },
    ...services.map((s) => ({ path: `/services/${s.slug}`, lastModified: s.updatedAt || undefined, priority: 0.8 })),
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
  ];
  if (projects.length > 0) {
    entries.push({ path: "/work", priority: 0.8 }, ...projects.map((p) => ({ path: `/work/${p.slug}`, lastModified: p.updatedAt || undefined, priority: 0.7 })));
  }
  if (products.length > 0) {
    entries.push({ path: "/products", priority: 0.8 }, ...products.map((p) => ({ path: `/products/${p.slug}`, lastModified: p.updatedAt || undefined, priority: 0.7 })));
  }
  return entries
    .filter((e) => e.path && !overrides.get(e.path)?.noindex)
    .map((e) => ({ url: absoluteUrl(e.path), lastModified: e.lastModified ? new Date(e.lastModified) : undefined, priority: e.priority }));
}
