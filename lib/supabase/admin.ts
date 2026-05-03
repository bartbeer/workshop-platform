import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client: bypass RLS, admin auth. Alleen in server-only code (webhooks, checkout).
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "X-Client-Info": "workshop-platform-admin",
      },
    },
  });
}

/**
 * RPC `confirmed_participants_by_sessions` mag met anon key; handig zonder user-cookies.
 */
export function createAnonServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
