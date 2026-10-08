import { z } from "zod";
import { CONTENT_STATUSES, HOME_SECTION_KEYS, PLATFORMS } from "@/types/content";

const trimmed = (max: number) => z.string().trim().max(max);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug is required.")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.");

/** Site-relative path or https URL. Rejects javascript:, data:, protocol-relative, etc. */
export const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\/[^\s]+$/i.test(v), "Use an https:// URL or a path starting with /.");
const httpsOnly = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Must start with https://");
const nullable = (s: z.ZodType<string, string>) => s.transform((v) => (v === "" ? null : v));

const titled = z.object({ title: trimmed(120), description: trimmed(600) });
const faq = z.object({ question: trimmed(240), answer: trimmed(2000) });
const link = z.object({ label: trimmed(60), url: safeUrl });
const nonEmpty = <T extends { title?: string; question?: string; label?: string }>(items: T[]) =>
  items.filter((i) => (i.title ?? i.question ?? i.label ?? "").length > 0);

export const statusSchema = z.enum(CONTENT_STATUSES);

export const serviceSchema = z.object({
  slug,
  title: trimmed(120).min(2, "Title is required."),
  shortDescription: trimmed(320).min(10, "Add a short description (10+ characters)."),
  fullDescription: trimmed(4000),
  icon: z.string().trim().max(40).nullable(),
  coverImage: nullable(safeUrl).nullable(),
  problems: z.array(trimmed(300)).max(20).transform((a) => a.filter(Boolean)),
  features: z.array(titled).max(20).transform(nonEmpty),
  benefits: z.array(trimmed(300)).max(20).transform((a) => a.filter(Boolean)),
  approach: z.array(titled).max(12).transform(nonEmpty),
  technologies: z.array(trimmed(40)).max(40),
  faq: z.array(faq).max(30).transform(nonEmpty),
  seoTitle: nullable(trimmed(70)).nullable(),
  seoDescription: nullable(trimmed(170)).nullable(),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
  status: statusSchema,
});

export const projectSchema = z.object({
  slug,
  title: trimmed(120).min(2, "Title is required."),
  summary: trimmed(320).min(10, "Add a summary (10+ characters)."),
  description: trimmed(20000),
  category: trimmed(60).min(2, "Category is required."),
  ownership: z.enum(["client", "company"]),
  platforms: z.array(z.enum(PLATFORMS)).max(5),
  technologies: z.array(trimmed(40)).max(40),
  coverImage: nullable(safeUrl).nullable(),
  screenshots: z.array(z.object({ url: safeUrl.refine((v) => v !== "", "Image URL required"), alt: trimmed(200) })).max(30),
  challenge: nullable(trimmed(8000)).nullable(),
  solution: nullable(trimmed(8000)).nullable(),
  results: z.array(trimmed(300)).max(20).transform((a) => a.filter(Boolean)),
  externalLinks: z.array(link).max(10).transform((a) => a.filter((l) => l.label && l.url)),
  attribution: nullable(trimmed(200)).nullable(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
  status: statusSchema,
  seoTitle: nullable(trimmed(70)).nullable(),
  seoDescription: nullable(trimmed(170)).nullable(),
});

export const productSchema = z.object({
  slug,
  name: trimmed(80).min(2, "Name is required."),
  tagline: trimmed(200).min(5, "Add a one-sentence description."),
  description: trimmed(20000),
  category: trimmed(60).min(2, "Category is required."),
  icon: nullable(safeUrl).nullable(),
  platforms: z.array(z.enum(PLATFORMS)).max(5),
  features: z.array(trimmed(200)).max(30).transform((a) => a.filter(Boolean)),
  screenshots: z.array(z.object({ url: safeUrl.refine((v) => v !== "", "Image URL required"), alt: trimmed(200) })).max(30),
  appStoreUrl: nullable(httpsOnly).nullable(),
  googlePlayUrl: nullable(httpsOnly).nullable(),
  microsoftStoreUrl: nullable(httpsOnly).nullable(),
  websiteUrl: nullable(httpsOnly).nullable(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
  status: statusSchema,
  seoTitle: nullable(trimmed(70)).nullable(),
  seoDescription: nullable(trimmed(170)).nullable(),
});

/* --------------------------------- Pages --------------------------------- */

const cta = z.object({ label: trimmed(40), href: safeUrl });
const stat = z.object({
  value: z.coerce.number().min(0).max(1e9),
  suffix: trimmed(6),
  label: trimmed(80),
  note: trimmed(120),
  verified: z.boolean(),
});
const testimonial = z.object({
  quote: trimmed(800),
  name: trimmed(80),
  role: trimmed(80),
  company: trimmed(80),
  approved: z.boolean(),
});

const base = { visible: z.boolean(), heading: trimmed(160), description: trimmed(400) };
export const homeSectionSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("stats"), ...base, items: z.array(stat).max(8) }),
  z.object({ key: z.literal("services"), ...base }),
  z.object({ key: z.literal("work"), ...base }),
  z.object({ key: z.literal("products"), ...base }),
  z.object({ key: z.literal("why"), ...base, items: z.array(titled).max(12) }),
  z.object({ key: z.literal("process"), ...base, items: z.array(titled).max(10) }),
  z.object({ key: z.literal("proof"), ...base, fallbackHeading: trimmed(160), testimonials: z.array(testimonial).max(12), highlights: z.array(titled).max(9) }),
  z.object({ key: z.literal("cta"), ...base, primaryCta: cta, secondaryCta: cta }),
]);

export const homeContentSchema = z.object({
  hero: z.object({
    eyebrow: trimmed(80),
    headline: trimmed(120).min(3, "Headline is required."),
    description: trimmed(400),
    primaryCta: cta,
    secondaryCta: cta,
    credibility: trimmed(200),
    backgroundImage: safeUrl,
  }),
  sections: z
    .array(homeSectionSchema)
    .max(HOME_SECTION_KEYS.length)
    .refine((s) => new Set(s.map((x) => x.key)).size === s.length, "Each section can appear only once."),
});

const blockId = z.string().trim().min(1).max(60);
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id: blockId, type: z.literal("heading"), text: trimmed(200), level: z.union([z.literal(2), z.literal(3)]) }),
  z.object({ id: blockId, type: z.literal("paragraph"), text: trimmed(4000) }),
  z.object({ id: blockId, type: z.literal("richText"), markdown: trimmed(30000) }),
  z.object({ id: blockId, type: z.literal("image"), url: safeUrl, alt: trimmed(200), caption: trimmed(300) }),
  z.object({ id: blockId, type: z.literal("cta"), heading: trimmed(160), description: trimmed(400), label: trimmed(40), href: safeUrl }),
  z.object({ id: blockId, type: z.literal("featureGrid"), heading: trimmed(160), items: z.array(titled).max(12) }),
  z.object({ id: blockId, type: z.literal("stats"), items: z.array(stat).max(8) }),
  z.object({ id: blockId, type: z.literal("faq"), heading: trimmed(160), items: z.array(faq).max(30) }),
  z.object({ id: blockId, type: z.literal("testimonial"), testimonial }),
]);

export const genericPageSchema = z.object({
  heading: trimmed(160).min(2, "Heading is required."),
  intro: trimmed(600),
  mission: trimmed(400).optional(),
  vision: trimmed(400).optional(),
  notice: trimmed(400).optional(),
  blocks: z.array(blockSchema).max(60),
});

/* ------------------------------- Settings -------------------------------- */

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #6366F1.");
const optionalEmail = z.string().trim().max(254).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email.");

export const settingsSchemas = {
  general: z.object({
    companyName: trimmed(80).min(2),
    siteUrl: httpsOnly.refine((v) => v !== "", "Required"),
    description: trimmed(300),
    footerDescription: trimmed(300),
    logoUrl: safeUrl,
    faviconUrl: safeUrl,
    contactEmail: optionalEmail,
    phone: trimmed(40),
    location: trimmed(120),
    socials: z.array(z.object({ label: trimmed(40), url: httpsOnly })).max(10).transform((a) => a.filter((s) => s.label && s.url)),
  }),
  branding: z.object({ primary: hex, secondary: hex, highlight: hex }),
  seo: z.object({
    defaultTitle: trimmed(70).min(5),
    titleTemplate: trimmed(70).refine((v) => v.includes("%s"), "Must contain %s where the page title goes."),
    defaultDescription: trimmed(170).min(20),
    ogImage: safeUrl,
  }),
  notifications: z.object({
    enabled: z.boolean(),
    recipients: z.array(z.string().trim().toLowerCase().pipe(z.email("Invalid recipient email."))).max(10),
  }),
  contact_form: z.object({
    budgetOptions: z.array(trimmed(60)).max(12).transform((a) => a.filter(Boolean)),
    timelineOptions: z.array(trimmed(60)).max(12).transform((a) => a.filter(Boolean)),
    consentText: trimmed(400).min(10),
    retentionDays: z.coerce.number().int().min(30).max(3650),
  }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;

export const seoOverrideSchema = z.object({
  path: z
    .string()
    .trim()
    .max(200)
    .regex(/^\/[a-z0-9\-/]*$/, "Path must start with / and use lowercase letters, numbers, hyphens.")
    .refine((p) => !/^\/(admin|api|auth)(\/|$)/.test(p), "Private paths cannot have SEO overrides."),
  title: nullable(trimmed(70)).nullable(),
  description: nullable(trimmed(170)).nullable(),
  ogTitle: nullable(trimmed(90)).nullable(),
  ogDescription: nullable(trimmed(200)).nullable(),
  ogImage: nullable(safeUrl).nullable(),
  canonicalUrl: nullable(httpsOnly).nullable(),
  noindex: z.boolean(),
});

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
