import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";

/**
 * Password hashing with Node's built-in scrypt. Stored format (no "$" so .env files don't
 * try to expand it):  scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>
 */
const KEYLEN = 64;
const DEFAULTS = { N: 2 ** 15, r: 8, p: 1 };

function scrypt(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, KEYLEN, { N, r, p, maxmem: 128 * N * r * 2 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string, params = DEFAULTS): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, params.N, params.r, params.p);
  return ["scrypt", params.N, params.r, params.p, salt.toString("base64url"), key.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts as [string, string, string, string, string, string];
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);
  if (!Number.isInteger(N) || N < 2 ** 14 || N > 2 ** 20 || !Number.isInteger(R) || !Number.isInteger(P) || R < 1 || P < 1 || R > 32 || P > 16) return false;
  const expected = Buffer.from(hashB64, "base64url");
  if (expected.length !== KEYLEN) return false;
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), N, R, P);
  return timingSafeEqual(actual, expected);
}

/** Short fingerprint of the stored hash; changing the password invalidates existing sessions. */
export function hashFingerprint(stored: string): string {
  return createHash("sha256").update(stored).digest("base64url").slice(0, 16);
}

export function passwordProblems(password: string): string | null {
  if (password.length < 14) return "Use at least 14 characters.";
  if (password.length > 256) return "Use at most 256 characters.";
  if (new Set(password).size < 6) return "Use a less repetitive password.";
  return null;
}
