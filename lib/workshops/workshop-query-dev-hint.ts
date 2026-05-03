import type { WorkshopListQueryError } from "./fetch-public-workshops";

/** Extra uitleg bij [dev] banner op homepage / workshops-lijst. */
export function workshopQueryDevHint(queryError: WorkshopListQueryError): string {
  const msg = queryError.message.toLowerCase();

  if (
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("certificate") ||
    msg.includes("ssl") ||
    msg.includes("tls")
  ) {
    return " Dit is een netwerk-/DNS-probleem (geen RLS). Controleer NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY (of PUBLISHABLE_KEY) in .env.local; herstart `npm run dev`. Bij lokale Supabase: `supabase start` en URL/key uit `supabase status`.";
  }

  if (queryError.code === "42703") {
    return " Voer op Supabase → SQL: `alter table public.workshops add column if not exists image_path text;` (zie supabase/migrations/).";
  }

  return " Check RLS `workshops_public_read`, env-keys en API-logs.";
}
