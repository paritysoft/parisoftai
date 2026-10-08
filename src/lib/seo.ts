import "server-only";
import type { Metadata } from "next";
import { getSeoOverrides, getSiteSettings } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";

interface BuildMetadataInput {
  path: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  /** Use the title as-is instead of applying the site title template */
  absoluteTitle?: boolean;
}

/**
 * Metadata precedence: admin SEO override for the path > entity SEO fields > site defaults.
 */
export async function buildMetadata(input: BuildMetadataInput): Promise<Metadata> {
  const [settings, overrides] = await Promise.all([getSiteSettings(), getSeoOverrides()]);
  const o = overrides.get(input.path);
  const seo = settings.seo;

  const rawTitle = o?.title ?? input.title ?? null;
  const title = rawTitle
    ? input.absoluteTitle || o?.title
      ? rawTitle
      : seo.titleTemplate.includes("%s")
        ? seo.titleTemplate.replace("%s", rawTitle)
        : rawTitle
    : seo.defaultTitle;
  const description = o?.description ?? input.description ?? seo.defaultDescription;
  const image = o?.ogImage ?? input.image ?? (seo.ogImage || absoluteUrl("/opengraph-image"));
  const canonical = o?.canonicalUrl ?? absoluteUrl(input.path);
  const noindex = Boolean(o?.noindex || input.noindex);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: input.type ?? "website",
      url: canonical,
      siteName: settings.general.companyName,
      title: o?.ogTitle ?? title,
      description: o?.ogDescription ?? description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: o?.ogTitle ?? title,
      description: o?.ogDescription ?? description,
      images: [image],
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}
