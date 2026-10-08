import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import {
  CONTENT_DIR,
  FILE_COLLECTIONS,
  REDIRECTS_PATH,
  parseStored,
  redirectsSchema,
  sortForDisplay,
  type FileCollection,
  type RedirectEntry,
  type StoredProduct,
  type StoredProject,
} from "@/lib/content/file-format";
import type { Product, Project } from "@/types/content";

/**
 * Reads the Git-backed content files bundled with the deployment. Used for the public site
 * whenever Supabase is not configured. Content changes arrive through a new commit, which
 * triggers a new Vercel deployment, so these reads are effectively static.
 */

const root = () => path.join(/*turbopackIgnore: true*/ process.cwd(), CONTENT_DIR);

export class ContentFileError extends Error {}

export async function readCollectionFiles(collection: FileCollection, dir = root()): Promise<(StoredProject | StoredProduct)[]> {
  const folder = path.join(dir, FILE_COLLECTIONS[collection].dir);
  let names: string[];
  try {
    names = (await fs.readdir(/*turbopackIgnore: true*/ folder)).filter((n) => n.endsWith(".json")).sort();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  const items: (StoredProject | StoredProduct)[] = [];
  const slugs = new Set<string>();
  for (const name of names) {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ path.join(folder, name), "utf8");
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new ContentFileError(`${CONTENT_DIR}/${FILE_COLLECTIONS[collection].dir}/${name}: invalid JSON`);
    }
    const parsed = parseStored(collection, json);
    if (!parsed.ok) throw new ContentFileError(`${CONTENT_DIR}/${FILE_COLLECTIONS[collection].dir}/${name}: ${parsed.error}`);
    if (`${parsed.value.id}.json` !== name) throw new ContentFileError(`${name}: file name must match its id (${parsed.value.id}.json)`);
    if (slugs.has(parsed.value.slug)) throw new ContentFileError(`${name}: duplicate slug "${parsed.value.slug}"`);
    slugs.add(parsed.value.slug);
    items.push(parsed.value);
  }
  return items;
}

function toPublic<T extends { status: string; sortOrder: number; publishedAt: string | null; slug: string }>(items: T[]): T[] {
  return sortForDisplay(items.filter((i) => i.status === "published"));
}

export const listPublishedProjectFiles = cache(async (): Promise<Project[]> => {
  const items = (await readCollectionFiles("projects")) as StoredProject[];
  return toPublic(items).map(({ createdAt: _c, ...p }) => (void _c, p));
});

export const listPublishedProductFiles = cache(async (): Promise<Product[]> => {
  const items = (await readCollectionFiles("products")) as StoredProduct[];
  return toPublic(items).map(({ createdAt: _c, ...p }) => (void _c, p));
});

export const readRedirectFile = cache(async (): Promise<RedirectEntry[]> => {
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ process.cwd(), REDIRECTS_PATH), "utf8");
    const parsed = redirectsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new ContentFileError(`${REDIRECTS_PATH}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    return parsed.data;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
});
