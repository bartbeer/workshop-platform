import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupUserIdByEmail } from "@/lib/workshops/enrollment-user";

export type InviteTeacherOutcome = "invited" | "promoted";

/**
 * Nieuwe teacher: Supabase invite-mail + profiel teacher.
 * Bestaand account: alleen profielrol teacher (geen dubbele invite).
 */
export async function inviteOrPromoteTeacher(email: string): Promise<InviteTeacherOutcome> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@") || normalized.length < 5) {
    throw new Error("Vul een geldig e-mailadres in.");
  }

  const admin = createAdminClient();
  const existingId = await lookupUserIdByEmail(admin, normalized);

  if (existingId) {
    const { data: profile, error: readErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", existingId)
      .maybeSingle<{ role: string }>();
    if (readErr) throw readErr;
    if (profile?.role === "owner") {
      throw new Error("Dit account is platform owner; rol niet gewijzigd.");
    }

    const { error } = await admin
      .from("profiles")
      .upsert({ id: existingId, role: "teacher" }, { onConflict: "id" });
    if (error) throw error;
    return "promoted";
  }

  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/set-password")}`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalized, { redirectTo });
  if (error) throw error;
  if (!data.user?.id) throw new Error("Uitnodigen mislukt: geen gebruikers-id.");

  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, role: "teacher" }, { onConflict: "id" });
  if (profileErr) throw profileErr;

  return "invited";
}
