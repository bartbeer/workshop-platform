"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getProfileRole,
  getTeacherRequestStatus,
  requireOwner,
  requireUser,
} from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canSubmitTeacherApplication } from "@/lib/teacher/teacher-application-access";

const applicationSchema = z.object({
  workshop_type: z.string().min(1, "Beschrijf welk type workshop je wilt geven"),
  experience: z.string().min(1, "Beschrijf je ervaring"),
  motivation: z.string().min(1, "Beschrijf je motivatie"),
});

export type SubmitTeacherApplicationState = { error?: string; ok?: boolean } | undefined;

export async function submitTeacherApplication(
  _prev: SubmitTeacherApplicationState,
  formData: FormData,
): Promise<SubmitTeacherApplicationState> {
  const user = await requireUser("/dashboard/become-teacher");
  const role = await getProfileRole(user.id);
  const applicationStatus = await getTeacherRequestStatus(user.id);

  if (!canSubmitTeacherApplication({ role, applicationStatus })) {
    return { error: "Je kunt momenteel geen aanvraag indienen." };
  }

  const parsed = applicationSchema.safeParse({
    workshop_type: formData.get("workshop_type"),
    experience: formData.get("experience"),
    motivation: formData.get("motivation"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_applications").insert({
    user_id: user.id,
    workshop_type: parsed.data.workshop_type.trim(),
    experience: parsed.data.experience.trim(),
    motivation: parsed.data.motivation.trim(),
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/become-teacher");
  revalidatePath("/admin");
  redirect("/dashboard/become-teacher?ok=submitted");
}

export async function reviewTeacherApplication(formData: FormData) {
  const owner = await requireOwner("/admin");

  const applicationId = String(formData.get("application_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!applicationId || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin?error=invalid_review");
  }

  const admin = createAdminClient();

  const { data: application, error: loadErr } = await admin
    .from("teacher_applications")
    .select("id, user_id, status")
    .eq("id", applicationId)
    .maybeSingle<{ id: string; user_id: string; status: string }>();

  if (loadErr || !application) redirect("/admin?error=application_not_found");
  if (application.status !== "pending") redirect("/admin?error=application_not_pending");

  const { error: updateErr } = await admin
    .from("teacher_applications")
    .update({
      status: decision,
      reviewed_by: owner.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateErr) redirect("/admin?error=review_failed");

  if (decision === "approved") {
    await admin
      .from("profiles")
      .upsert({ id: application.user_id, role: "teacher" }, { onConflict: "id" });
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/become-teacher");
  redirect(`/admin?ok=application_${decision}`);
}
