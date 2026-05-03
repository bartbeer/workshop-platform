import type { SupabaseClient } from "@supabase/supabase-js";

/** Velden voor homepage en overzicht `/workshops`. */
export type MarketingWorkshopRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_path: string | null;
};

export type WorkshopListQueryError = {
  message: string;
  code?: string;
};

/**
 * Publieke workshoplijst (anon Supabase-client, onder RLS).
 * Bij fout: `console.warn` (geen `console.error`) zodat Next.js dev geen fullscreen overlay triggert;
 * logs staan nog steeds in de terminal.
 */
export async function fetchMarketingWorkshops(supabase: SupabaseClient): Promise<{
  workshops: MarketingWorkshopRow[];
  queryError: WorkshopListQueryError | null;
}> {
  const { data, error } = await supabase
    .from("workshops")
    .select("id,slug,title,description,image_path")
    .order("title", { ascending: true });

  if (error) {
    console.warn(
      "[workshops] public list query failed:",
      error.code ?? "(no code)",
      error.message,
      error.details ?? "",
      error.hint ?? "",
    );
    return {
      workshops: [],
      queryError: { message: error.message, code: error.code },
    };
  }

  return {
    workshops: (data ?? []) as MarketingWorkshopRow[],
    queryError: null,
  };
}
