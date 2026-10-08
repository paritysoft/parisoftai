import "server-only";

/**
 * Server-side environment access. Secrets never leave this module's callers on the server.
 * Supports both the current Supabase key names (publishable/secret) and the legacy ones (anon/service_role).
 */
export const serverEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // Defaults: send from the verified parisoftai.com domain in Resend, deliver to info@parisoftai.com.
  contactFromEmail: (process.env.CONTACT_FROM_EMAIL ?? "").trim() || "ParitySoft AI Website <noreply@parisoftai.com>",
  contactNotificationEmail: (process.env.CONTACT_NOTIFICATION_EMAIL ?? "").trim() || "info@parisoftai.com",
  // SMTP (e.g. Zoho Mail for info@parisoftai.com). Takes priority over Resend when set.
  smtpUser: (process.env.SMTP_USER ?? "").trim(),
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpHost: (process.env.SMTP_HOST ?? "").trim(),
  smtpPort: Number(process.env.SMTP_PORT ?? 465) || 465,
  rateLimitSalt: process.env.RATE_LIMIT_SALT ?? "",
  vercelEnv: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "development"),
  productionSupabaseRef: process.env.SUPABASE_PRODUCTION_PROJECT_REF ?? "",
  analyticsDashboardUrl: process.env.ANALYTICS_DASHBOARD_URL ?? "",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(serverEnv.supabaseUrl && serverEnv.supabasePublishableKey);
}

export function isServiceRoleConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(serverEnv.supabaseSecretKey);
}

/**
 * Guard against preview/development deployments writing to the production database.
 * When SUPABASE_PRODUCTION_PROJECT_REF is set and a non-production deployment points at
 * that project, all admin writes are refused.
 */
export function isWriteBlocked(): boolean {
  if (!serverEnv.productionSupabaseRef) return false;
  if (serverEnv.vercelEnv === "production") return false;
  return serverEnv.supabaseUrl.includes(serverEnv.productionSupabaseRef);
}
