import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createSessionClient } from "@/lib/supabase/server";
import { mapProduct, mapProject, mapSeo, mapService } from "@/lib/content/mappers";
import { normalizeGenericPage, normalizeHome } from "@/lib/content/normalize";
import { listPublishedProductFiles, listPublishedProjectFiles, readRedirectFile } from "@/lib/content/file-store";
import { serviceSeeds } from "@/content/services";
import { pageSeeds } from "@/content/pages";
import { settingsSeed } from "@/content/settings";
import type {
  GenericPageContent,
  HomeContent,
  PageKey,
  Product,
  Project,
  SeoOverride,
  Service,
  SiteSettings,
} from "@/types/content";

/**
 * Single entry point for public content. Reads published rows through the anonymous
 * client (RLS-restricted). When an admin enables preview (Next.js draft mode), reads go
 * through the admin's session so drafts become visible to them only.
 * Without Supabase configured, bundled content is returned: services/pages/settings from
 * src/content and portfolio projects/products from the Git-backed files in /content.
 */

export class ContentError extends Error {}

const isPreview = cache(async (): Promise<boolean> => {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
});

const getClient = cache(async (): Promise<SupabaseClient | null> => {
  if (!isSupabaseConfigured()) return null;
  if (await isPreview()) return createSessionClient();
  return createPublicClient();
});

function fail(what: string, error: { message: string } | null): never {
  throw new ContentError(`Failed to load ${what}: ${error?.message ?? "unknown error"}`);
}

/* -------------------------------- Settings -------------------------------- */

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const db = await getClient();
  if (!db) return settingsSeed;
  const { data, error } = await db.from("site_settings").select("key, value").in("key", ["general", "branding", "seo", "contact_form"]);
  if (error) fail("settings", error);
  const merged: SiteSettings = structuredClone(settingsSeed);
  for (const row of data ?? []) {
    const key = row.key as keyof SiteSettings;
    if (key in merged && row.value && typeof row.value === "object") {
      // shallow merge keeps defaults for any field missing in the database
      (merged as unknown as Record<string, object>)[key] = { ...merged[key], ...row.value };
    }
  }
  return merged;
});

/* ---------------------------------- Pages --------------------------------- */

async function loadPageContent(key: PageKey): Promise<unknown | null> {
  const db = await getClient();
  if (!db) return pageSeeds[key].content;

  if (await isPreview()) {
    const { data: page } = await db.from("pages").select("id, published_content").eq("key", key).maybeSingle();
    if (!page) return null;
    const { data: rev } = await db
      .from("page_revisions")
      .select("content")
      .eq("page_id", page.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return rev?.content ?? page.published_content;
  }

  const { data, error } = await db.from("pages").select("published_content").eq("key", key).eq("status", "published").maybeSingle();
  if (error) fail(`page ${key}`, error);
  return data?.published_content ?? null;
}

export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const raw = await loadPageContent("home");
  return normalizeHome(raw);
});

export const getPageContent = cache(async (key: Exclude<PageKey, "home">): Promise<GenericPageContent | null> => {
  const raw = await loadPageContent(key);
  if (!raw) return null;
  return normalizeGenericPage(raw, pageSeeds[key].content as GenericPageContent);
});

/* -------------------------------- Services -------------------------------- */

const seedServices = (): Service[] =>
  serviceSeeds.map((s, i) => ({ ...s, id: `seed-${i}`, coverImage: null, status: "published", updatedAt: "" }));

export const listServices = cache(async (): Promise<Service[]> => {
  const db = await getClient();
  if (!db) return seedServices();
  const query = db.from("services").select("*").order("sort_order").order("title");
  const { data, error } = (await isPreview()) ? await query.neq("status", "archived") : await query.eq("status", "published");
  if (error) fail("services", error);
  return (data ?? []).map(mapService);
});

export const getService = cache(async (slug: string): Promise<Service | null> => {
  const all = await listServices();
  return all.find((s) => s.slug === slug) ?? null;
});

/* -------------------------------- Portfolio ------------------------------- */

export const listProjects = cache(async (): Promise<Project[]> => {
  const db = await getClient();
  if (!db) return listPublishedProjectFiles();
  const query = db.from("portfolio_projects").select("*, portfolio_images(*)").order("sort_order").order("created_at", { ascending: false });
  const { data, error } = (await isPreview()) ? await query.neq("status", "archived") : await query.eq("status", "published");
  if (error) fail("portfolio", error);
  return (data ?? []).map(mapProject);
});

export const getProject = cache(async (slug: string): Promise<Project | null> => {
  return (await listProjects()).find((p) => p.slug === slug) ?? null;
});

/* -------------------------------- Products -------------------------------- */

export const listProducts = cache(async (): Promise<Product[]> => {
  const db = await getClient();
  if (!db) return listPublishedProductFiles();
  const query = db.from("products").select("*, product_images(*)").order("sort_order").order("name");
  const { data, error } = (await isPreview()) ? await query.neq("status", "archived") : await query.eq("status", "published");
  if (error) fail("products", error);
  return (data ?? []).map(mapProduct);
});

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  return (await listProducts()).find((p) => p.slug === slug) ?? null;
});

/* ------------------------------ SEO & redirects ---------------------------- */

export const getSeoOverrides = cache(async (): Promise<Map<string, SeoOverride>> => {
  const db = await getClient();
  if (!db) return new Map();
  const { data, error } = await db.from("seo_metadata").select("*");
  if (error) fail("SEO metadata", error);
  return new Map((data ?? []).map((r) => [r.path as string, mapSeo(r)]));
});

export async function findRedirect(path: string): Promise<string | null> {
  const db = await getClient();
  if (!db) return (await readRedirectFile()).find((r) => r.from === path)?.to ?? null;
  const { data } = await db.from("slug_redirects").select("to_path").eq("from_path", path).maybeSingle();
  return (data?.to_path as string | undefined) ?? null;
}

export { isPreview };
