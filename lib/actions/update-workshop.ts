"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { fetchApprovedTeacherOptions } from "@/lib/workshops/fetch-approved-teachers";
import { getImageDimensionsFromBuffer } from "@/lib/workshops/image-dimensions";
import { validateSessionTeacherAssignments } from "@/lib/workshops/session-teacher-assignment";
import {
  mapSessionFormToRows,
  parseWorkshopFormPayload,
} from "@/lib/workshops/workshop-form-schema";
import {
  WORKSHOP_IMAGE_BUCKET,
  WORKSHOP_IMAGE_MAX_BYTES,
  WORKSHOP_IMAGE_PIXEL_SIZE,
  workshopImageExtensionFromMime,
  workshopImageFilenameAllowed,
} from "@/lib/workshops/workshop-image-rules";

export type UpdateWorkshopState = { error?: string } | undefined;

export async function updateWorkshopWithSessions(
  _prev: UpdateWorkshopState,
  formData: FormData,
): Promise<UpdateWorkshopState> {
  const user = await requireOwner("/admin/workshops");

  const workshopId = String(formData.get("workshop_id") ?? "");
  if (!workshopId) return { error: "Workshop ontbreekt." };

  const parsed = parseWorkshopFormPayload({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    default_price_eur: formData.get("default_price_eur"),
    sessions: formData.get("sessions_json"),
  });

  if (!parsed.ok) return { error: parsed.error };

  const teachers = await fetchApprovedTeacherOptions();
  const teacherIds = new Set(teachers.map((t) => t.id));
  const assignmentCheck = validateSessionTeacherAssignments(parsed.data.sessions, teacherIds);
  if (!assignmentCheck.ok) {
    if (assignmentCheck.reason === "missing_teacher") {
      return { error: "Kies een docent voor elke sessie." };
    }
    return { error: "Een gekozen docent is niet geldig." };
  }

  const supabase = await createClient();
  const { data: existing, error: loadErr } = await supabase
    .from("workshops")
    .select("id, slug, image_path")
    .eq("id", workshopId)
    .maybeSingle<{ id: string; slug: string; image_path: string | null }>();

  if (loadErr || !existing) return { error: "Workshop niet gevonden." };

  const defaultEur = parsed.data.default_price_eur;
  const defaultPriceCents =
    defaultEur === "" || defaultEur === undefined
      ? null
      : Math.round(Number(defaultEur) * 100);

  const slugInput = parsed.data.slug?.trim();
  const slug = slugInput || existing.slug;

  let imagePath = existing.image_path;
  const imageInput = formData.get("image");

  if (imageInput instanceof File && imageInput.size > 0) {
    if (!workshopImageFilenameAllowed(imageInput.name)) {
      return { error: "Alleen PNG, JPG/JPEG of WEBP zijn toegestaan." };
    }
    if (imageInput.size > WORKSHOP_IMAGE_MAX_BYTES) {
      return { error: "Afbeelding is te groot (max 5 MB)." };
    }
    const ext = workshopImageExtensionFromMime(imageInput.type);
    if (!ext) return { error: "Gebruik PNG, JPG of WEBP voor de workshopafbeelding." };
    const ab = await imageInput.arrayBuffer();
    const dims = getImageDimensionsFromBuffer(ab);
    if (
      !dims ||
      dims.width !== WORKSHOP_IMAGE_PIXEL_SIZE ||
      dims.height !== WORKSHOP_IMAGE_PIXEL_SIZE
    ) {
      return {
        error: `De afbeelding moet exact ${WORKSHOP_IMAGE_PIXEL_SIZE} × ${WORKSHOP_IMAGE_PIXEL_SIZE} pixels zijn.`,
      };
    }
    imagePath = `${user.id}/${slug}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from(WORKSHOP_IMAGE_BUCKET)
      .upload(imagePath, imageInput, { upsert: true, contentType: imageInput.type });
    if (uploadErr) return { error: `Upload mislukt: ${uploadErr.message}` };
  }

  const firstTeacherId = parsed.data.sessions[0]!.teacher_user_id;

  const { error: wErr } = await supabase
    .from("workshops")
    .update({
      slug,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      price_cents: defaultPriceCents,
      image_path: imagePath,
      teacher_user_id: firstTeacherId,
    })
    .eq("id", workshopId);

  if (wErr) return { error: wErr.message };

  const sessionIdsRaw = formData.get("session_ids_json");
  let sessionIds: string[] = [];
  try {
    sessionIds = JSON.parse(typeof sessionIdsRaw === "string" ? sessionIdsRaw : "[]");
  } catch {
    return { error: "Ongeldige sessie-id's." };
  }

  const mapped = mapSessionFormToRows(parsed.data.sessions, workshopId, defaultPriceCents);

  for (let i = 0; i < mapped.length; i += 1) {
    const row = mapped[i]!;
    const sessionId = sessionIds[i];

    if (sessionId) {
      const { error } = await supabase
        .from("workshop_sessions")
        .update({
          teacher_user_id: row.teacher_user_id,
          starts_at: row.starts_at,
          location: row.location,
          max_participants: row.max_participants,
          price_cents: row.price_cents,
          session_description: row.session_description,
          duration_minutes: row.duration_minutes,
          extra_info: row.extra_info,
        })
        .eq("id", sessionId)
        .eq("workshop_id", workshopId);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("workshop_sessions").insert({
        ...row,
        workshop_id: workshopId,
      });
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/workshops");
  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/admin/workshops");
  revalidatePath(`/admin/workshops/${workshopId}/edit`);

  redirect(`/admin/workshops/${workshopId}/edit?ok=saved`);
}
