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
  contactFromEmail: process.env.CONTACT_FROM_EMAIL ?? "",
  contactNotificationEmail: process.env.CONTACT_NOTIFICATION_EMAIL ?? "",
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
