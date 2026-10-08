export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const PLATFORMS = ["ios", "android", "macos", "windows", "web"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  ios: "iOS",
  android: "Android",
  macos: "macOS",
  windows: "Windows",
  web: "Web",
};

export const STAFF_ROLES = ["super_admin", "admin", "editor"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
};

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TitledItem {
  title: string;
  description: string;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface CtaLink {
  label: string;
  href: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
  /** Context shown under the number, e.g. "Founder's experience" */
  note: string;
  /** Only verified stats render on the public site. */
  verified: boolean;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  /** Must be explicitly approved for publication by the client. */
  approved: boolean;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string | null;
  coverImage: string | null;
  problems: string[];
  features: TitledItem[];
  benefits: string[];
  approach: TitledItem[];
  technologies: string[];
  faq: FAQItem[];
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  status: ContentStatus;
  updatedAt: string;
}

export interface GalleryImage {
  id?: string;
  url: string;
  alt: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  ownership: "client" | "company";
  platforms: Platform[];
  technologies: string[];
  coverImage: string | null;
  screenshots: GalleryImage[];
  challenge: string | null;
  solution: string | null;
  results: string[];
  externalLinks: LinkItem[];
  attribution: string | null;
  featured: boolean;
  sortOrder: number;
  status: ContentStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  icon: string | null;
  platforms: Platform[];
  features: string[];
  screenshots: GalleryImage[];
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
  microsoftStoreUrl: string | null;
  websiteUrl: string | null;
  featured: boolean;
  sortOrder: number;
  status: ContentStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

/* ----------------------------- Page content ----------------------------- */

export type Block =
  | { id: string; type: "heading"; text: string; level: 2 | 3 }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "richText"; markdown: string }
  | { id: string; type: "image"; url: string; alt: string; caption: string }
  | { id: string; type: "cta"; heading: string; description: string; label: string; href: string }
  | { id: string; type: "featureGrid"; heading: string; items: TitledItem[] }
  | { id: string; type: "stats"; items: StatItem[] }
  | { id: string; type: "faq"; heading: string; items: FAQItem[] }
  | { id: string; type: "testimonial"; testimonial: Testimonial };

export type BlockType = Block["type"];

export interface GenericPageContent {
  heading: string;
  intro: string;
  mission?: string;
  vision?: string;
  /** Shown as a notice banner, e.g. for legal drafts awaiting review. */
  notice?: string;
  blocks: Block[];
}

export const HOME_SECTION_KEYS = ["stats", "services", "work", "products", "why", "process", "proof", "cta"] as const;
export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export interface HomeSectionBase {
  key: HomeSectionKey;
  visible: boolean;
  heading: string;
  description: string;
}

export type HomeSection =
  | (HomeSectionBase & { key: "stats"; items: StatItem[] })
  | (HomeSectionBase & { key: "services" })
  | (HomeSectionBase & { key: "work" })
  | (HomeSectionBase & { key: "products" })
  | (HomeSectionBase & { key: "why"; items: TitledItem[] })
  | (HomeSectionBase & { key: "process"; items: TitledItem[] })
  | (HomeSectionBase & {
      key: "proof";
      fallbackHeading: string;
      testimonials: Testimonial[];
      highlights: TitledItem[];
    })
  | (HomeSectionBase & { key: "cta"; primaryCta: CtaLink; secondaryCta: CtaLink });

export interface HomeContent {
  hero: {
    eyebrow: string;
    headline: string;
    description: string;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
    credibility: string;
    backgroundImage: string;
  };
  sections: HomeSection[];
}

export type PageKey = "home" | "about" | "contact" | "privacy" | "terms";

export interface PageRecord<T = HomeContent | GenericPageContent> {
  id: string;
  key: PageKey;
  title: string;
  status: ContentStatus;
  content: T;
  publishedAt: string | null;
  updatedAt: string;
}

/* ------------------------------- Settings ------------------------------- */

export interface GeneralSettings {
  companyName: string;
  siteUrl: string;
  description: string;
  footerDescription: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  phone: string;
  location: string;
  socials: LinkItem[];
}

export interface BrandingSettings {
  primary: string;
  secondary: string;
  highlight: string;
}

export interface SeoSettings {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  ogImage: string;
}

export interface NotificationSettings {
  enabled: boolean;
  recipients: string[];
}

export interface ContactFormSettings {
  budgetOptions: string[];
  timelineOptions: string[];
  consentText: string;
  retentionDays: number;
}

export interface SiteSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  seo: SeoSettings;
  contact_form: ContactFormSettings;
}

export interface SeoOverride {
  path: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
}
