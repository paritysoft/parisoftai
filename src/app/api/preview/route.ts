import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

/** Enables Next.js draft mode for signed-in staff only, then opens the requested public path. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session.kind !== "staff") return NextResponse.redirect(new URL("/admin/login", request.url));
  const raw = request.nextUrl.searchParams.get("path") ?? "/";
  const path = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/admin") && !raw.startsWith("/api") ? raw : "/";
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, request.url));
}
