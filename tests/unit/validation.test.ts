import { describe, expect, it } from "vitest";
import { genericPageSchema, homeContentSchema, productSchema, serviceSchema } from "@/lib/validation/content";
import { homeSeed, pageSeeds } from "@/content/pages";
import { serviceSeeds } from "@/content/services";
import { normalizeHome } from "@/lib/content/normalize";

describe("seed content is valid against admin schemas", () => {
  it("home page", () => expect(homeContentSchema.safeParse(homeSeed).success).toBe(true));
  it.each(["about", "contact", "privacy", "terms"] as const)("%s page", (k) => expect(genericPageSchema.safeParse(pageSeeds[k].content).success).toBe(true));
  it.each(serviceSeeds.map((s) => [s.slug, s]))("service %s", (_slug, s) => {
    const r = serviceSchema.safeParse({ ...s, coverImage: "", seoTitle: s.seoTitle ?? "", seoDescription: s.seoDescription ?? "", status: "published" });
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });
});

describe("content validation", () => {
  const product = {
    slug: "my-app",
    name: "My App",
    tagline: "Does a useful thing.",
    description: "",
    categories: ["Utility"],
    icon: "",
    platforms: ["ios"],
    features: ["", "Fast"],
    screenshots: [],
    appStoreUrl: "",
    googlePlayUrl: "",
    microsoftStoreUrl: "",
    websiteUrl: "",
    featured: false,
    sortOrder: 1,
    status: "draft",
    seoTitle: "",
    seoDescription: "",
  };
  it("normalises empty strings to null and drops empty list items", () => {
    const r = productSchema.parse(product);
    expect(r.appStoreUrl).toBeNull();
    expect(r.features).toEqual(["Fast"]);
  });
  it("rejects non-https store links and javascript: URLs", () => {
    expect(productSchema.safeParse({ ...product, appStoreUrl: "http://apps.apple.com" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, icon: "javascript:alert(1)" }).success).toBe(false);
  });
  it("rejects invalid slugs and unknown platforms", () => {
    expect(productSchema.safeParse({ ...product, slug: "Bad Slug!" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, platforms: ["linux"] }).success).toBe(false);
  });
  it("rejects duplicated homepage sections", () => {
    const dup = { ...homeSeed, sections: [homeSeed.sections[0], homeSeed.sections[0]] };
    expect(homeContentSchema.safeParse(dup).success).toBe(false);
  });
});

describe("normalizeHome", () => {
  it("fills missing sections (hidden) and hero fields", () => {
    const n = normalizeHome({ hero: { headline: "Hi" }, sections: [{ key: "cta", visible: true, heading: "Go" }] });
    expect(n.hero.headline).toBe("Hi");
    expect(n.hero.primaryCta.href).toBe("/contact");
    expect(n.sections[0]?.key).toBe("cta");
    expect(n.sections.find((s) => s.key === "stats")?.visible).toBe(false);
  });
  it("tolerates garbage", () => expect(normalizeHome("nope").sections).toHaveLength(9));
});
