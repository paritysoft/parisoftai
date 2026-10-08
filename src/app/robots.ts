import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Admin pages are protected by authentication and send `X-Robots-Tag: noindex`; the disallow
 * rules below only keep crawlers from wasting requests on them.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = (process.env.VERCEL_ENV ?? "production") === "production";
  if (!isProduction) {
    // Preview deployments must never be indexed
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/git-cms"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
