"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cmsEnv, cmsMode, isGitAdminConfigured } from "@/lib/cms/config";
import { verifyPassword } from "@/lib/cms/password";
import { clearFailures, isLocked, recordFailure } from "@/lib/cms/rate-limit";
import { CmsAuthError, clearSessionCookie, requireCmsAction, setSessionCookie } from "@/lib/cms/session";
import { getContentStore } from "@/lib/cms/store";
import { deleteItem, saveItem, stageImage, type CmsResult, type PendingUpload } from "@/lib/cms/service";
import { ID_PATTERN, type FileCollection } from "@/lib/content/file-format";
import { GitHubError } from "@/lib/cms/github";

/* All actions here are for the Git-backed admin and refuse to run when Supabase is the CMS. */

const COLLECTIONS: FileCollection[] = ["projects", "products"];
const asCollection = (c: unknown): FileCollection => {
  if (!COLLECTIONS.includes(c as FileCollection)) throw new CmsAuthError("Unknown collection.");
  return c as FileCollection;
};

async function guarded<T>(fn: () => Promise<CmsResult<T>>): Promise<CmsResult<T>> {
  try {
    if (cmsMode() !== "git") return { ok: false, error: "The Git-backed admin is disabled because Supabase is configured." };
    await requireCmsAction();
    return await fn();
  } catch (e) {
    if (e instanceof CmsAuthError) return { ok: false, error: e.message };
    if (e instanceof GitHubError) {
      console.error("[cms] GitHub error", e.status, e.message);
      return { ok: false, error: `Could not save to GitHub. ${e.message}` };
    }
    console.error("[cms] unexpected error", e);
    return { ok: false, error: "Something went wrong while saving. Nothing was published. Please try again." };
  }
}

function storeOrError() {
  const store = getContentStore();
  if (!store) throw new CmsAuthError("Publishing is not configured: set GITHUB_CONTENT_TOKEN and GITHUB_CONTENT_REPO in Vercel (see docs/CONTENT_PUBLISHING.md).");
  return store;
}

/* ---------------------------------- Auth ---------------------------------- */

export async function cmsLoginAction(_prev: { error?: string; email?: string } | null, form: FormData): Promise<{ error?: string; email?: string }> {
  if (cmsMode() !== "git" || !isGitAdminConfigured()) return { error: "Admin sign-in is not configured." };
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  if (isLocked(ip)) return { error: "Too many failed attempts. Try again in 15 minutes.", email };

  const password = String(form.get("password") ?? "").slice(0, 256);
  const env = cmsEnv();
  // Always run the hash so response time does not reveal whether the email matched.
  const passwordOk = await verifyPassword(password, env.passwordHash);
  if (!passwordOk || email !== env.adminEmail) {
    recordFailure(ip);
    return { error: "Incorrect email or password.", email };
  }
  clearFailures(ip);
  await setSessionCookie(env.adminEmail);
  const next = String(form.get("next") ?? "");
  redirect(/^\/admin(\/[a-z0-9\-/]*)?$/.test(next) && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function cmsLogoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

/* --------------------------------- Content -------------------------------- */

export async function cmsSaveAction(collection: string, id: string | null, input: unknown, expectedUpdatedAt: string | null, uploads: PendingUpload[]) {
  return guarded(async () => {
    if (id !== null && (typeof id !== "string" || !ID_PATTERN.test(id))) return { ok: false, error: "Invalid item id." };
    const safeUploads = Array.isArray(uploads)
      ? uploads.slice(0, 60).filter((u): u is PendingUpload => !!u && typeof u.path === "string" && (u.blobSha === undefined || typeof u.blobSha === "string"))
      : [];
    return saveItem(storeOrError(), asCollection(collection), id, input, {
      expectedUpdatedAt: typeof expectedUpdatedAt === "string" ? expectedUpdatedAt : null,
      uploads: safeUploads,
    });
  });
}

export async function cmsDeleteAction(collection: string, id: string) {
  return guarded(async () => {
    if (typeof id !== "string" || !ID_PATTERN.test(id)) return { ok: false, error: "Invalid item id." };
    return deleteItem(storeOrError(), asCollection(collection), id);
  });
}

export async function cmsUploadAction(form: FormData) {
  return guarded(async () => {
    const file = form.get("file");
    if (!(file instanceof File)) return { ok: false, error: "No file received." };
    const collection = asCollection(form.get("collection"));
    return stageImage(storeOrError(), collection, { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  });
}
