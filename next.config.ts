import type { NextConfig } from "next";

const supabaseUrl = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
  } catch {
    return null;
  }
})();
const siteIsHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://parisoftai.com").startsWith("https://");

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy. 'unsafe-inline' for styles is required by Next.js/Motion inline styles;
// scripts are limited to self (+ Vercel analytics). Supabase is allowed for auth, data and storage.
const supabaseOrigin = supabaseUrl?.origin ?? "";
const supabaseWs = supabaseUrl ? supabaseUrl.origin.replace(/^http/, "ws") : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https: ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://vitals.vercel-insights.com https://va.vercel-scripts.com`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev || !siteIsHttps ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(siteIsHttps ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseUrl
      ? [{ protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https", hostname: supabaseUrl.hostname, port: supabaseUrl.port, pathname: "/storage/v1/object/public/**" }]
      : [],
    // Allow optimising images from a local Supabase in development/testing only
    dangerouslyAllowLocalIP: supabaseUrl ? ["localhost", "127.0.0.1"].includes(supabaseUrl.hostname) : false,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.parisoftai.com" }], destination: "https://parisoftai.com/:path*", permanent: true }];
  },
};

export default nextConfig;
