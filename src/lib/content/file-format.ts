import { z } from "zod";
import { productSchema, projectSchema } from "@/lib/validation/content";
import type { Product, Project } from "@/types/content";

/**
 * Git-backed content files.
 *
 *   content/projects/<id>.json   one portfolio project per file
 *   content/products/<id>.json   one product per file
 *   content/redirects.json       old URL → new URL (written when a published slug changes)
 *
 * Files are named by a stable id, so renaming a slug edits the same file instead of
 * creating a duplicate page. Every file is validated with the same Zod schema the admin
 * panel uses; an invalid file fails the build (the previous deployment stays live).
 */

export const CONTENT_DIR = "content";
export const FILE_COLLECTIONS = {
  projects: { dir: "projects", publicPrefix: "/work/", label: "project" },
  products: { dir: "products", publicPrefix: "/products/", label: "product" },
} as const;
export type FileCollection = keyof typeof FILE_COLLECTIONS;

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{5,63}$/;

const meta = {
  id: z.string().regex(ID_PATTERN, "Invalid id."),
  createdAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid createdAt."),
  updatedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid updatedAt."),
};

export const storedProjectSchema = projectSchema.and(z.object(meta));
export const storedProductSchema = productSchema.and(z.object(meta));

export const redirectsSchema = z
  .array(
    z.object({
      from: z.string().regex(/^\/(work|products)\/[a-z0-9-]+$/),
      to: z.string().regex(/^\/(work|products)\/[a-z0-9-]+$/),
    }),
  )
  .max(1000);
export type RedirectEntry = z.infer<typeof redirectsSchema>[number];

export type StoredProject = Omit<Project, "updatedAt"> & { createdAt: string; updatedAt: string };
export type StoredProduct = Omit<Product, "updatedAt"> & { createdAt: string; updatedAt: string };

export function parseStored(collection: FileCollection, raw: unknown): { ok: true; value: StoredProject | StoredProduct } | { ok: false; error: string } {
  const schema = collection === "projects" ? storedProjectSchema : storedProductSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".") || "file"}: ${i.message}`).join("; ") };
  return { ok: true, value: parsed.data as StoredProject | StoredProduct };
}

/** Stable, readable JSON (2-space indent, trailing newline) so Git diffs stay small. */
export function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function filePath(collection: FileCollection, id: string): string {
  if (!ID_PATTERN.test(id)) throw new Error("Invalid content id");
  return `${CONTENT_DIR}/${FILE_COLLECTIONS[collection].dir}/${id}.json`;
}

export const REDIRECTS_PATH = `${CONTENT_DIR}/redirects.json`;

/** Public listing order: display order, then newest publication first, then name. */
export function sortForDisplay<T extends { sortOrder: number; publishedAt: string | null; slug: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || a.slug.localeCompare(b.slug),
  );
}

/**
 * Adds/updates redirects after a published item's slug changes. Removes chains
 * (A→B, B→C becomes A→C, B→C) and any redirect whose source is now a live URL.
 */
export function updateRedirects(existing: RedirectEntry[], from: string, to: string): RedirectEntry[] {
  if (from === to) return existing.filter((r) => r.from !== to);
  const next = existing.filter((r) => r.from !== from && r.from !== to).map((r) => (r.to === from ? { ...r, to } : r));
  next.push({ from, to });
  return next;
}
