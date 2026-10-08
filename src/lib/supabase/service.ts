import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/**
 * Privileged client using the secret/service-role key. Bypasses RLS.
 * Use ONLY for: storing public lead submissions, rate limiting, and super-admin
 * user invitations (after the caller's role has been verified).
 */
export function createServiceClient(): SupabaseClient {
  if (!serverEnv.supabaseSecretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }
  return createClient(serverEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
