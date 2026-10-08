// No "server-only" import: the proxy uses this module too. Nothing here is NEXT_PUBLIC_.

/**
 * Git-backed CMS configuration (used while Supabase is not configured).
 *
 *   ADMIN_EMAIL             the single admin's sign-in email
 *   ADMIN_PASSWORD_HASH     scrypt hash from `npm run admin:hash-password` (never the password itself)
 *   ADMIN_SESSION_SECRET    32+ random characters used to sign the session cookie
 *   GITHUB_CONTENT_TOKEN    fine-grained token: this repository only, "Contents: read and write"
 *   GITHUB_CONTENT_REPO     owner/repo, e.g. paritysoft/parisoftai
 *   GITHUB_CONTENT_BRANCH   branch Vercel deploys to production from (default: main)
 *
 * None of these are NEXT_PUBLIC_, so they never reach the browser.
 */

export type CmsMode = "supabase" | "git";
export type PublishTarget = "github" | "filesystem" | "none";

/** Supabase is the CMS when its URL and key are configured (same rule as src/lib/env.ts). */
export function cmsMode(): CmsMode {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? "supabase" : "git";
}

export const cmsEnv = () => ({
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
  passwordHash: (process.env.ADMIN_PASSWORD_HASH ?? "").trim(),
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? "",
  githubToken: process.env.GITHUB_CONTENT_TOKEN ?? "",
  githubRepo: (process.env.GITHUB_CONTENT_REPO ?? "").trim(),
  githubBranch: (process.env.GITHUB_CONTENT_BRANCH ?? "main").trim() || "main",
});

export function isGitAdminConfigured(): boolean {
  const e = cmsEnv();
  return Boolean(e.adminEmail && e.passwordHash.startsWith("scrypt:") && e.sessionSecret.length >= 32);
}

export function publishTarget(): PublishTarget {
  const e = cmsEnv();
  if (e.githubToken && /^[\w.-]+\/[\w.-]+$/.test(e.githubRepo)) return "github";
  // Writing to the local working tree only makes sense on a developer machine (never on Vercel).
  if (process.env.VERCEL) return "none";
  if (process.env.NODE_ENV !== "production" || process.env.CMS_FILESYSTEM_WRITES === "true") return "filesystem";
  return "none";
}
