/** Only allow redirects to internal admin paths (prevents open redirects). */
export function safeAdminNext(next: string | null | undefined, fallback = "/admin"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\") || /[\r\n]/.test(next)) return fallback;
  return next;
}
