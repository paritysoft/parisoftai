/** Public, non-secret site constants usable on server and client. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://parisoftai.com").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
