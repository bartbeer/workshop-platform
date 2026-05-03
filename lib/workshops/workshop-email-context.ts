import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkshopEmailContext = {
  workshopTitle: string;
  workshopSlug: string;
  startsAt: string;
  location: string | null;
};

type SessionRow = {
  starts_at: string;
  location: string | null;
  workshops: { title: string; slug: string } | null;
};

/** Voor gepersonaliseerde mails (invite-metadata, Resend). */
export async function fetchWorkshopEmailContext(
  admin: SupabaseClient,
  workshopSessionId: string,
): Promise<WorkshopEmailContext | null> {
  const { data, error } = await admin
    .from("workshop_sessions")
    .select("starts_at, location, workshops(title, slug)")
    .eq("id", workshopSessionId)
    .maybeSingle<SessionRow>();

  if (error || !data?.workshops?.title || !data.workshops.slug) return null;

  return {
    workshopTitle: data.workshops.title,
    workshopSlug: data.workshops.slug,
    startsAt: data.starts_at,
    location: data.location,
  };
}

export function formatSessionDateTimeNl(iso: string): string {
  try {
    return new Date(iso).toLocaleString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
