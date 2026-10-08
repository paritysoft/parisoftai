import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { CMS_COOKIE, verifySessionToken } from "@/lib/cms/token";

const GIT_CMS_PREFIX = "/git-cms";

/**
 * Git-backed admin (no Supabase): /admin/* is rewritten to the internal /git-cms routes.
 * Signed-out visitors are sent to /admin/login. Pages and Server Actions verify the session again.
 */
async function gitCms(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return NextResponse.next();
  const isLogin = pathname === "/admin/login";
  if (!isLogin) {
    const session = await verifySessionToken(request.cookies.get(CMS_COOKIE)?.value);
    if (!session) {
      const login = request.nextUrl.clone();
      login.pathname = "/admin/login";
      login.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
      return NextResponse.redirect(login);
    }
  }
  const target = request.nextUrl.clone();
  target.pathname = `${GIT_CMS_PREFIX}${pathname.slice("/admin".length)}`;
  target.search = search;
  const res = NextResponse.rewrite(target);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * Runs only for /admin, /auth and admin APIs. Refreshes the Supabase session cookie and sends
 * signed-out visitors to the login page. This is a convenience layer — every admin page and
 * Server Action re-checks authorization on the server, and RLS enforces it in the database.
 */
export async function proxy(request: NextRequest) {
  // The internal Git-CMS routes are only reachable through the /admin rewrite.
  if (request.nextUrl.pathname === GIT_CMS_PREFIX || request.nextUrl.pathname.startsWith(`${GIT_CMS_PREFIX}/`)) {
    return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return gitCms(request);

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !signedIn && !PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/git-cms", "/git-cms/:path*", "/auth/:path*", "/api/admin/:path*", "/api/preview/:path*"],
};
