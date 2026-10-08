import { randomUUID } from "node:crypto";
import type { ContentStore } from "@/lib/cms/store";
import type { TreeChange } from "@/lib/cms/github";
import {
  FILE_COLLECTIONS,
  REDIRECTS_PATH,
  filePath,
  parseStored,
  redirectsSchema,
  serialize,
  sortForDisplay,
  updateRedirects,
  type FileCollection,
  type RedirectEntry,
  type StoredProduct,
  type StoredProject,
} from "@/lib/content/file-format";
import { productSchema, projectSchema, zodFieldErrors } from "@/lib/validation/content";
import { ALLOWED_MIME, EXTENSIONS, safeFileName, sniffImageType, type AllowedMime } from "@/lib/media/validate";

/**
 * Admin publishing logic for the Git-backed CMS. All I/O goes through a ContentStore, so this
 * module is unit-tested with an in-memory store.
 */

export type Stored = StoredProject | StoredProduct;
export type CmsResult<T = undefined> = { ok: true; message: string; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Images uploaded during this editing session, not yet committed. */
export interface PendingUpload {
  path: string;
  blobSha?: string;
}

export const UPLOAD_PATH = /^\/uploads\/(projects|products)\/[a-z0-9][a-z0-9-]{0,100}\.(png|jpg|webp|avif)$/;
export const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;
const GIT_SHA = /^[0-9a-f]{40}$/;

export async function listItems(store: ContentStore, collection: FileCollection): Promise<{ items: Stored[]; invalid: { path: string; error: string }[] }> {
  const files = await store.listFiles(collection);
  const items: Stored[] = [];
  const invalid: { path: string; error: string }[] = [];
  for (const f of files) {
    let json: unknown;
    try {
      json = JSON.parse(f.text);
    } catch {
      invalid.push({ path: f.path, error: "Invalid JSON" });
      continue;
    }
    const parsed = parseStored(collection, json);
    if (parsed.ok) items.push(parsed.value);
    else invalid.push({ path: f.path, error: parsed.error });
  }
  return { items: sortForDisplay(items), invalid };
}

async function readRedirects(store: ContentStore): Promise<RedirectEntry[]> {
  const text = await store.readText(REDIRECTS_PATH);
  if (!text) return [];
  const parsed = redirectsSchema.safeParse(JSON.parse(text));
  return parsed.success ? parsed.data : [];
}

function referencedImages(v: Record<string, unknown>): Set<string> {
  const urls = new Set<string>();
  for (const k of ["coverImage", "icon", "ogImage"]) if (typeof v[k] === "string" && v[k]) urls.add(v[k] as string);
  if (Array.isArray(v.screenshots)) for (const s of v.screenshots as { url: string }[]) urls.add(s.url);
  return urls;
}

const nameOf = (v: Stored) => ("title" in v ? v.title : v.name);

export async function saveItem(
  store: ContentStore,
  collection: FileCollection,
  id: string | null,
  input: unknown,
  opts: { expectedUpdatedAt?: string | null; uploads?: PendingUpload[]; now?: Date } = {},
): Promise<CmsResult<{ id: string; updatedAt: string }>> {
  const schema = collection === "projects" ? projectSchema : productSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const value = parsed.data as Record<string, unknown> & { slug: string; status: string; publishedAt: string | null };

  const { items } = await listItems(store, collection);
  const existing = id ? items.find((i) => i.id === id) : undefined;
  if (id && !existing) return { ok: false, error: `This ${FILE_COLLECTIONS[collection].label} no longer exists. It may have been deleted in another tab.` };
  if (existing && opts.expectedUpdatedAt && existing.updatedAt !== opts.expectedUpdatedAt) {
    return { ok: false, error: "This item was changed elsewhere since you opened it. Reload the page to get the latest version, then re-apply your edits." };
  }
  if (items.some((i) => i.slug === value.slug && i.id !== id)) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another item already uses this slug." } };
  }

  // Every image path must exist in the repository or be uploaded in this save.
  const pending = new Map((opts.uploads ?? []).filter((u) => UPLOAD_PATH.test(u.path)).map((u) => [u.path, u]));
  const images = referencedImages(value);
  const newImages: TreeChange[] = [];
  for (const url of images) {
    const upload = pending.get(url);
    if (upload) {
      if (store.kind === "github") {
        if (!upload.blobSha || !GIT_SHA.test(upload.blobSha)) return { ok: false, error: "An uploaded image is missing its reference. Upload it again." };
        newImages.push({ path: `public${url}`, blobSha: upload.blobSha });
      }
    }
  }

  const now = (opts.now ?? new Date()).toISOString();
  const newId = existing?.id ?? randomUUID();
  const record = {
    id: newId,
    ...value,
    publishedAt: value.publishedAt ?? existing?.publishedAt ?? (value.status === "published" ? now : null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const prefix = FILE_COLLECTIONS[collection].publicPrefix;
  const changes: TreeChange[] = [{ path: filePath(collection, newId), content: serialize(record) }, ...newImages];

  // Keep old links working when a published item's slug changes; never redirect away from a live URL.
  const redirects = await readRedirects(store);
  let nextRedirects = redirects.filter((r) => r.from !== `${prefix}${value.slug}`);
  if (existing && existing.status === "published" && existing.slug !== value.slug) {
    nextRedirects = updateRedirects(nextRedirects, `${prefix}${existing.slug}`, `${prefix}${value.slug}`);
  }
  if (JSON.stringify(nextRedirects) !== JSON.stringify(redirects)) changes.push({ path: REDIRECTS_PATH, content: serialize(nextRedirects) });

  const label = FILE_COLLECTIONS[collection].label;
  const verb = !existing ? "add" : existing.status !== "published" && value.status === "published" ? "publish" : existing.status === "published" && value.status !== "published" ? "unpublish" : "update";
  await store.commit(`content: ${verb} ${label} "${nameOf(record as Stored)}" (${value.status})\n\nSaved from the ParitySoft AI admin panel.`, changes);

  const live = store.kind === "github" ? " The live website updates after Vercel finishes the new deployment (usually 1–3 minutes)." : " Saved to your local content folder — commit and push to publish.";
  const message =
    value.status === "published"
      ? `Published.${live}`
      : verb === "unpublish"
        ? `Unpublished — removed from the website and sitemap.${live}`
        : value.status === "archived"
          ? "Saved as archived (not shown on the website)."
          : "Draft saved (not shown on the website).";
  return { ok: true, message, data: { id: newId, updatedAt: now } };
}

export async function deleteItem(store: ContentStore, collection: FileCollection, id: string): Promise<CmsResult> {
  const { items } = await listItems(store, collection);
  const existing = items.find((i) => i.id === id);
  if (!existing) return { ok: false, error: "Item not found. It may already have been deleted." };
  await store.commit(`content: delete ${FILE_COLLECTIONS[collection].label} "${nameOf(existing)}"\n\nDeleted from the ParitySoft AI admin panel.`, [{ path: filePath(collection, id), delete: true }]);
  return { ok: true, message: existing.status === "published" ? "Deleted. The page disappears from the website after the next deployment." : "Deleted." };
}

/** Validates an uploaded image and stages it. Returns the public path to store in the item. */
export async function stageImage(store: ContentStore, collection: FileCollection, file: { name: string; bytes: Uint8Array }, now = new Date()): Promise<CmsResult<PendingUpload>> {
  if (file.bytes.byteLength === 0) return { ok: false, error: "The file is empty." };
  if (file.bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, error: "Images must be 3.5 MB or smaller. Export as WebP or compress the image first." };
  const mime = sniffImageType(file.bytes);
  if (!mime || mime === "image/svg+xml" || !(ALLOWED_MIME as readonly string[]).includes(mime)) {
    return { ok: false, error: "Unsupported image. Use PNG, JPEG, WebP or AVIF." };
  }
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const publicPath = `/uploads/${collection}/${stamp}-${randomUUID().slice(0, 8)}-${safeFileName(file.name).slice(0, 50)}.${EXTENSIONS[mime as AllowedMime]}`;
  if (!UPLOAD_PATH.test(publicPath)) return { ok: false, error: "Could not create a safe file name." };
  const staged = await store.stageBinary(publicPath, file.bytes);
  return { ok: true, message: "Uploaded. It is saved with the item when you click Save.", data: { path: publicPath, blobSha: staged.blobSha } };
}
