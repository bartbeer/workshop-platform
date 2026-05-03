import { createClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import { supabaseFetch } from "@/lib/supabase/fetch-with-retry";
import "@/lib/supabase/prefer-ipv4-dns";

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
      fetch: supabaseFetch,
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
    global: {
      fetch: supabaseFetch,
    },
  });
}
