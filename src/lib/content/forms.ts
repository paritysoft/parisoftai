import type { ProductForm, ProjectForm, ServiceForm } from "@/components/admin/editors";
import type { Product, Project, Service } from "@/types/content";

export const emptyService: ServiceForm = {
  slug: "", title: "", shortDescription: "", fullDescription: "", icon: "code", coverImage: "", problems: [], features: [], benefits: [], approach: [], technologies: [], faq: [], seoTitle: "", seoDescription: "", sortOrder: 100, status: "draft",
};
export const emptyProject: ProjectForm = {
  slug: "", title: "", summary: "", description: "", category: "", ownership: "company", clientApproved: false, platforms: [], technologies: [], keyFeatures: [], coverImage: "", screenshots: [], challenge: "", solution: "", results: [], projectUrl: "", appStoreUrl: "", googlePlayUrl: "", microsoftStoreUrl: "", externalLinks: [], attribution: "", featured: false, sortOrder: 100, status: "draft", seoTitle: "", seoDescription: "", ogImage: "", publishedAt: "",
};
export const emptyProduct: ProductForm = {
  slug: "", name: "", tagline: "", description: "", categories: [], icon: "", platforms: [], features: [], screenshots: [], appStoreUrl: "", googlePlayUrl: "", microsoftStoreUrl: "", websiteUrl: "", featured: false, sortOrder: 100, status: "draft", seoTitle: "", seoDescription: "", ogImage: "", publishedAt: "",
};

export function serviceToForm(s: Service): ServiceForm {
  const { id: _id, updatedAt: _u, ...rest } = s;
  void _id; void _u;
  return { ...rest, coverImage: s.coverImage ?? "", seoTitle: s.seoTitle ?? "", seoDescription: s.seoDescription ?? "" };
}
export function projectToForm(p: Project): ProjectForm {
  const { id: _id, updatedAt: _u, ...rest } = p;
  void _id; void _u;
  return {
    ...rest,
    coverImage: p.coverImage ?? "",
    challenge: p.challenge ?? "",
    solution: p.solution ?? "",
    attribution: p.attribution ?? "",
    projectUrl: p.projectUrl ?? "",
    appStoreUrl: p.appStoreUrl ?? "",
    googlePlayUrl: p.googlePlayUrl ?? "",
    microsoftStoreUrl: p.microsoftStoreUrl ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    ogImage: p.ogImage ?? "",
    publishedAt: p.publishedAt ?? "",
    screenshots: p.screenshots.map(({ url, alt }) => ({ url, alt })),
  };
}
export function productToForm(p: Product): ProductForm {
  const { id: _id, updatedAt: _u, ...rest } = p;
  void _id; void _u;
  return {
    ...rest,
    icon: p.icon ?? "",
    appStoreUrl: p.appStoreUrl ?? "",
    googlePlayUrl: p.googlePlayUrl ?? "",
    microsoftStoreUrl: p.microsoftStoreUrl ?? "",
    websiteUrl: p.websiteUrl ?? "",
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    ogImage: p.ogImage ?? "",
    publishedAt: p.publishedAt ?? "",
    screenshots: p.screenshots.map(({ url, alt }) => ({ url, alt })),
  };
}
