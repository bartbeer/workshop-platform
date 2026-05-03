import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Vernieuwt de Auth-sessie (cookies) vóór render.
 * Aanroepen vanuit `src/proxy.ts` (Next.js 16; vervanger van root `middleware.ts`).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    // Netwerk/time-out naar Supabase mag navigatie niet breken; anders zie je o.a. bij server
    // actions een lange wacht + TypeError in de dev-terminal.
    console.warn(
      "[supabase middleware] auth refresh mislukt (netwerk/time-out?); request gaat door zonder sessie-update.",
      error instanceof Error ? error.message : error,
    );
  }

  return supabaseResponse;
}
