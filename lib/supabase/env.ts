/**
 * Publieke Supabase-config (NEXT_PUBLIC_*).
 * Ondersteunt zowel de klassieke anon key als de nieuwe publishable key.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Zie Supabase Dashboard → Project Settings → API.",
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase Dashboard → API).",
    );
  }
  return key;
}

/** Alleen server-side (webhooks, checkout-afhandeling). Nooit naar de client bundlen. */
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Alleen op de server; Supabase Dashboard → API → service_role.",
    );
  }
  return key.trim();
}
