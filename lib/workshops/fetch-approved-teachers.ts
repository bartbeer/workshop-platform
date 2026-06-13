import { createAdminClient } from "@/lib/supabase/admin";

export type ApprovedTeacherOption = {
  id: string;
  label: string;
};

export async function fetchApprovedTeacherOptions(): Promise<ApprovedTeacherOption[]> {
  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, role")
    .in("role", ["teacher", "owner"]);

  if (error) throw error;

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: labels, error: labelErr } = await admin.rpc("teacher_labels_by_user_ids", {
    p_user_ids: ids,
  });
  if (labelErr) throw labelErr;

  const labelById = new Map((labels ?? []).map((row: { user_id: string; label: string }) => [row.user_id, row.label]));

  return ids
    .map((id) => ({
      id,
      label: labelById.get(id) ?? id.slice(0, 8),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "nl"));
}
