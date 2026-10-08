import type {
  ContentStatus,
  FAQItem,
  GalleryImage,
  LinkItem,
  Platform,
  Product,
  Project,
  SeoOverride,
  Service,
  TitledItem,
} from "@/types/content";
import { PLATFORMS } from "@/types/content";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come from untyped Supabase queries */
type Row = Record<string, any>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const platforms = (v: unknown): Platform[] => strArr(v).filter((p): p is Platform => (PLATFORMS as readonly string[]).includes(p));
const titled = (v: unknown): TitledItem[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x: Row) => ({ title: str(x.title), description: str(x.description) })) : [];
const faq = (v: unknown): FAQItem[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x: Row) => ({ question: str(x.question), answer: str(x.answer) })) : [];
const links = (v: unknown): LinkItem[] =>
  Array.isArray(v) ? v.filter((x) => x && typeof x === "object").map((x: Row) => ({ label: str(x.label), url: str(x.url) })) : [];
const images = (v: unknown): GalleryImage[] =>
  Array.isArray(v)
    ? [...v]
        .sort((a: Row, b: Row) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((x: Row) => ({ id: x.id, url: str(x.url), alt: str(x.alt) }))
    : [];

export function mapService(r: Row): Service {
  return {
    id: str(r.id),
    slug: str(r.slug),
    title: str(r.title),
    shortDescription: str(r.short_description),
    fullDescription: str(r.full_description),
    icon: strOrNull(r.icon),
    coverImage: strOrNull(r.cover_image),
    problems: strArr(r.problems),
    features: titled(r.features),
    benefits: strArr(r.benefits),
    approach: titled(r.approach),
    technologies: strArr(r.technologies),
    faq: faq(r.faq),
    seoTitle: strOrNull(r.seo_title),
    seoDescription: strOrNull(r.seo_description),
    sortOrder: Number(r.sort_order ?? 0),
    status: (r.status ?? "draft") as ContentStatus,
    updatedAt: str(r.updated_at),
  };
}

export function mapProject(r: Row): Project {
  return {
    id: str(r.id),
    slug: str(r.slug),
    title: str(r.title),
    summary: str(r.summary),
    description: str(r.description),
    category: str(r.category),
    ownership: r.ownership === "company" ? "company" : "client",
    platforms: platforms(r.platforms),
    technologies: strArr(r.technologies),
    coverImage: strOrNull(r.cover_image),
    screenshots: images(r.portfolio_images),
    challenge: strOrNull(r.challenge),
    solution: strOrNull(r.solution),
    results: strArr(r.results),
    externalLinks: links(r.external_links),
    attribution: strOrNull(r.attribution),
    featured: Boolean(r.featured),
    sortOrder: Number(r.sort_order ?? 0),
    status: (r.status ?? "draft") as ContentStatus,
    seoTitle: strOrNull(r.seo_title),
    seoDescription: strOrNull(r.seo_description),
    updatedAt: str(r.updated_at),
  };
}

export function mapProduct(r: Row): Product {
  return {
    id: str(r.id),
    slug: str(r.slug),
    name: str(r.name),
    tagline: str(r.tagline),
    description: str(r.description),
    category: str(r.category),
    icon: strOrNull(r.icon),
    platforms: platforms(r.platforms),
    features: strArr(r.features),
    screenshots: images(r.product_images),
    appStoreUrl: strOrNull(r.app_store_url),
    googlePlayUrl: strOrNull(r.google_play_url),
    microsoftStoreUrl: strOrNull(r.microsoft_store_url),
    websiteUrl: strOrNull(r.website_url),
    featured: Boolean(r.featured),
    sortOrder: Number(r.sort_order ?? 0),
    status: (r.status ?? "draft") as ContentStatus,
    seoTitle: strOrNull(r.seo_title),
    seoDescription: strOrNull(r.seo_description),
    updatedAt: str(r.updated_at),
  };
}

export function mapSeo(r: Row): SeoOverride {
  return {
    path: str(r.path),
    title: strOrNull(r.title),
    description: strOrNull(r.description),
    ogTitle: strOrNull(r.og_title),
    ogDescription: strOrNull(r.og_description),
    ogImage: strOrNull(r.og_image),
    canonicalUrl: strOrNull(r.canonical_url),
    noindex: Boolean(r.noindex),
  };
}

/** camelCase domain object -> snake_case columns for writes */
export function serviceToRow(s: Partial<Service>): Row {
  return dropUndefined({
    slug: s.slug,
    title: s.title,
    short_description: s.shortDescription,
    full_description: s.fullDescription,
    icon: s.icon,
    cover_image: s.coverImage,
    problems: s.problems,
    features: s.features,
    benefits: s.benefits,
    approach: s.approach,
    technologies: s.technologies,
    faq: s.faq,
    seo_title: s.seoTitle,
    seo_description: s.seoDescription,
    sort_order: s.sortOrder,
    status: s.status,
  });
}

export function projectToRow(p: Partial<Project>): Row {
  return dropUndefined({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    description: p.description,
    category: p.category,
    ownership: p.ownership,
    platforms: p.platforms,
    technologies: p.technologies,
    cover_image: p.coverImage,
    challenge: p.challenge,
    solution: p.solution,
    results: p.results,
    external_links: p.externalLinks,
    attribution: p.attribution,
    featured: p.featured,
    sort_order: p.sortOrder,
    status: p.status,
    seo_title: p.seoTitle,
    seo_description: p.seoDescription,
  });
}

export function productToRow(p: Partial<Product>): Row {
  return dropUndefined({
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    category: p.category,
    icon: p.icon,
    platforms: p.platforms,
    features: p.features,
    app_store_url: p.appStoreUrl,
    google_play_url: p.googlePlayUrl,
    microsoft_store_url: p.microsoftStoreUrl,
    website_url: p.websiteUrl,
    featured: p.featured,
    sort_order: p.sortOrder,
    status: p.status,
    seo_title: p.seoTitle,
    seo_description: p.seoDescription,
  });
}

function dropUndefined(obj: Row): Row {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
