import { absoluteUrl } from "@/lib/site";
import { OPERATING_SYSTEMS, type Product, type Project, type Service } from "@/types/content";

/**
 * schema.org JSON-LD builders (BreadcrumbList is emitted by <Breadcrumbs>). Only facts present in published content are emitted:
 * no ratings, reviews, prices, addresses or awards are ever generated.
 */

export const ORG_ID = absoluteUrl("/#organization");
export const WEBSITE_ID = absoluteUrl("/#website");

export function organizationJsonLd(general: { companyName: string; description: string; logoUrl: string; contactEmail: string }, sameAs: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: general.companyName,
    url: absoluteUrl("/"),
    description: general.description,
    logo: general.logoUrl ? absoluteUrl(general.logoUrl) : absoluteUrl("/icon.svg"),
    ...(general.contactEmail ? { email: general.contactEmail } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name,
    url: absoluteUrl("/"),
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

export function serviceJsonLd(service: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    serviceType: service.title,
    description: service.seoDescription ?? service.shortDescription,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@id": ORG_ID },
    areaServed: "Worldwide",
  };
}

function storeUrls(p: { appStoreUrl: string | null; googlePlayUrl: string | null; microsoftStoreUrl: string | null }, extra: (string | null)[] = []) {
  return [p.appStoreUrl, p.googlePlayUrl, p.microsoftStoreUrl, ...extra].filter((u): u is string => Boolean(u && u.startsWith("https://")));
}

export function productJsonLd(product: Product) {
  const os = product.platforms.map((p) => OPERATING_SYSTEMS[p]).filter(Boolean);
  const image = product.icon ?? product.screenshots[0]?.url ?? null;
  const sameAs = storeUrls(product, [product.websiteUrl]);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.seoDescription ?? product.tagline,
    url: absoluteUrl(`/products/${product.slug}`),
    ...(product.categories[0] ? { applicationCategory: product.categories[0] } : {}),
    ...(os.length ? { operatingSystem: os.join(", ") } : {}),
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(product.screenshots.length ? { screenshot: product.screenshots.map((s) => absoluteUrl(s.url)) } : {}),
    ...(product.features.length ? { featureList: product.features.join(", ") } : {}),
    ...(product.publishedAt ? { datePublished: product.publishedAt.slice(0, 10) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    publisher: { "@id": ORG_ID },
  };
}

export function projectJsonLd(project: Project) {
  const sameAs = storeUrls(project, [project.projectUrl]);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.seoDescription ?? project.summary,
    url: absoluteUrl(`/work/${project.slug}`),
    ...(project.coverImage ? { image: absoluteUrl(project.coverImage) } : {}),
    ...(project.technologies.length ? { keywords: project.technologies.join(", ") } : {}),
    ...(project.publishedAt ? { datePublished: project.publishedAt.slice(0, 10) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    creator: { "@id": ORG_ID },
  };
}
