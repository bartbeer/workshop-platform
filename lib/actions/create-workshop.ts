"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { fetchApprovedTeacherOptions } from "@/lib/workshops/fetch-approved-teachers";
import { getImageDimensionsFromBuffer } from "@/lib/workshops/image-dimensions";
import { validateSessionTeacherAssignments } from "@/lib/workshops/session-teacher-assignment";
import { slugifyTitle } from "@/lib/workshops/slug";
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

async function ensureUniqueSlug(base: string): Promise<string> {
  const supabase = await createClient();
  let slug = base;
  let n = 2;
  for (let i = 0; i < 100; i += 1) {
    const { data } = await supabase.from("workshops").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
  return `${base}-${Date.now()}`;
}

export type CreateWorkshopState = { error?: string } | undefined;

export async function createWorkshopWithSessions(
  _prev: CreateWorkshopState,
  formData: FormData,
): Promise<CreateWorkshopState> {
  const user = await requireOwner("/admin/workshops/new");

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

  const { title, description } = parsed.data;
  const slugInput = parsed.data.slug?.trim();
  const baseSlug = slugInput || slugifyTitle(title);
  const slug = await ensureUniqueSlug(baseSlug);
  const imageInput = formData.get("image");

  const defaultEur = parsed.data.default_price_eur;
  const defaultPriceCents =
    defaultEur === "" || defaultEur === undefined
      ? null
      : Math.round(Number(defaultEur) * 100);

  const supabase = await createClient();
  let imagePath: string | null = null;

  if (imageInput instanceof File && imageInput.size > 0) {
    if (!workshopImageFilenameAllowed(imageInput.name)) {
      return {
        error:
          "Alleen PNG, JPG/JPEG of WEBP zijn toegestaan (controleer de bestandsnaam en extensie).",
      };
    }
    if (imageInput.size > WORKSHOP_IMAGE_MAX_BYTES) {
      return { error: "Afbeelding is te groot (max 5 MB)." };
    }
    const ext = workshopImageExtensionFromMime(imageInput.type);
    if (!ext) {
      return { error: "Gebruik PNG, JPG of WEBP voor de workshopafbeelding." };
    }
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
      .upload(imagePath, imageInput, {
        upsert: true,
        contentType: imageInput.type,
      });
    if (uploadErr) {
      return { error: `Upload van afbeelding mislukt: ${uploadErr.message}` };
    }
  }

  const firstTeacherId = parsed.data.sessions[0]!.teacher_user_id;

  const { data: workshop, error: wErr } = await supabase
    .from("workshops")
    .insert({
      slug,
      title: title.trim(),
      description: description?.trim() || null,
      price_cents: defaultPriceCents,
      image_path: imagePath,
      teacher_user_id: firstTeacherId,
    })
    .select("id")
    .single();

  if (wErr || !workshop) {
    return { error: wErr?.message ?? "Workshop opslaan mislukt." };
  }

  const sessionRows = mapSessionFormToRows(parsed.data.sessions, workshop.id, defaultPriceCents);

  const { error: sErr } = await supabase.from("workshop_sessions").insert(sessionRows);

  if (sErr) {
    return { error: sErr.message };
  }

  revalidatePath("/workshops");
  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/admin/workshops");

  redirect(`/workshops/${slug}`);
}
