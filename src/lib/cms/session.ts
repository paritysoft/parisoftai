import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CMS_COOKIE, SESSION_MAX_AGE_S, createSessionToken, verifySessionToken, type CmsSession } from "@/lib/cms/token";

export { CMS_COOKIE, type CmsSession } from "@/lib/cms/token";
export async function setSessionCookie(email: string): Promise<void> {
  (await cookies()).set(CMS_COOKIE, await createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(CMS_COOKIE);
}

export async function getCmsSession(): Promise<CmsSession | null> {
  return verifySessionToken((await cookies()).get(CMS_COOKIE)?.value);
}

/** For pages: sends signed-out visitors to the login page. */
export async function requireCmsPage(): Promise<CmsSession> {
  const session = await getCmsSession();
  if (!session) redirect("/admin/login");
  return session;
}

export class CmsAuthError extends Error {}

/** For Server Actions: throws instead of redirecting. */
export async function requireCmsAction(): Promise<CmsSession> {
  const session = await getCmsSession();
  if (!session) throw new CmsAuthError("Your session has expired. Sign in again.");
  return session;
}
