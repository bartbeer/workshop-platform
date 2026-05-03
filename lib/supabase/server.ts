import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseFetch } from "./fetch-with-retry";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import "./prefer-ipv4-dns";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: {
      fetch: supabaseFetch,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components kunnen geen response cookies zetten; sessie vernieuwt via proxy.
        }
      },
    },
  });
}
