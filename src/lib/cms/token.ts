import { SignJWT, jwtVerify } from "jose";
import { cmsEnv, isGitAdminConfigured } from "@/lib/cms/config";
import { hashFingerprint } from "@/lib/cms/password";

/** Session token helpers without next/headers, so the proxy can use them too. */

export const CMS_COOKIE = "psai_admin";
export const SESSION_MAX_AGE_S = 8 * 60 * 60;
const ISSUER = "parisoftai-cms";

const key = () => new TextEncoder().encode(cmsEnv().sessionSecret);

export interface CmsSession {
  email: string;
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ fp: hashFingerprint(cmsEnv().passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined): Promise<CmsSession | null> {
  if (!token || !isGitAdminConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { issuer: ISSUER, algorithms: ["HS256"] });
    const env = cmsEnv();
    if (payload.sub !== env.adminEmail) return null;
    if (payload.fp !== hashFingerprint(env.passwordHash)) return null;
    return { email: payload.sub };
  } catch {
    return null;
  }
}
