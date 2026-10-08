/**
 * Best-effort, in-memory login throttling (per server instance). It slows down online guessing;
 * the real protection is a long random password hashed with scrypt.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const buckets = new Map<string, { failures: number; resetAt: number }>();

export function isLocked(key: string, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b) return false;
  if (b.resetAt <= now) {
    buckets.delete(key);
    return false;
  }
  return b.failures >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()): void {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) buckets.set(key, { failures: 1, resetAt: now + WINDOW_MS });
  else b.failures += 1;
  if (buckets.size > 10_000) buckets.clear(); // memory guard
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}
