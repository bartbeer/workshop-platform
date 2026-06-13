import type { SupabaseClient } from "@supabase/supabase-js";

import { PARTICIPANT_PROFILE_ROLE } from "@/lib/auth/profile-role";
import { getSiteUrl } from "@/lib/site-url";

import { formatSessionDateTimeNl, type WorkshopEmailContext } from "./workshop-email-context";

export type InviteWorkshopMeta = WorkshopEmailContext & { participantCount: number };

export async function lookupUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.rpc("get_user_id_by_email", { p_email: email });
  if (error) throw error;
  if (!data) return null;
  return String(data);
}

/**
 * user_metadata wordt in Supabase Email Templates gebruikt als {{ .Data.workshop_title }}, enz.
 * Zie `supabase/email-templates/invite-user-nl.html`.
 */
export async function inviteNewGuestUser(
  admin: SupabaseClient,
  email: string,
  workshop: InviteWorkshopMeta,
): Promise<string> {
  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/set-password")}`;
  const whenNl = formatSessionDateTimeNl(workshop.startsAt);
  const loc = workshop.location?.trim() ?? "";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      workshop_title: workshop.workshopTitle,
      workshop_slug: workshop.workshopSlug,
      session_datetime_nl: whenNl,
      session_location: loc,
      participant_count: String(workshop.participantCount),
    },
  });
  if (error) throw error;
  if (!data.user?.id) throw new Error("inviteUserByEmail: geen user id");

  await admin
    .from("profiles")
    .upsert({ id: data.user.id, role: PARTICIPANT_PROFILE_ROLE }, { onConflict: "id" });

  return data.user.id;
}
