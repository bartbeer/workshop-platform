"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireApprovedTeacher } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { slugifyTitle } from "@/lib/workshops/slug";

const sessionSchema = z.object({
  starts_at: z.string().min(1, "Kies datum en tijd"),
  location: z.string().optional(),
  max_participants: z.coerce.number().int().min(1).max(500),
  price_eur: z.union([z.number(), z.literal("")]).optional(),
  session_description: z.string().max(8000).optional(),
  duration_hours: z.number().min(0.25).max(48).optional(),
  extra_info: z.string().max(8000).optional(),
});

const payloadSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  slug: z.string().optional(),
  description: z.string().optional(),
  default_price_eur: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  sessions: z.array(sessionSchema).min(1, "Voeg minstens één datum toe"),
});

const WORKSHOP_IMAGE_BUCKET = "workshop-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionFromMimeType(mimeType: string): string | null {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return null;
}

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
  const user = await requireApprovedTeacher("/dashboard/workshops/new");

  const sessionsRaw = formData.get("sessions_json");
  let sessionsParsed: unknown = [];
  try {
    sessionsParsed = JSON.parse(
      typeof sessionsRaw === "string" && sessionsRaw ? sessionsRaw : "[]",
    );
  } catch {
    return { error: "Ongeldige sessiedata." };
  }

  const parsed = payloadSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    default_price_eur: formData.get("default_price_eur"),
    sessions: sessionsParsed,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
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
    if (imageInput.size > MAX_IMAGE_BYTES) {
      return { error: "Afbeelding is te groot (max 5 MB)." };
    }
    const ext = extensionFromMimeType(imageInput.type);
    if (!ext) {
      return { error: "Gebruik PNG, JPG of WEBP voor de workshopafbeelding." };
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

  const { data: workshop, error: wErr } = await supabase
    .from("workshops")
    .insert({
      slug,
      title: title.trim(),
      description: description?.trim() || null,
      price_cents: defaultPriceCents,
      image_path: imagePath,
      teacher_user_id: user.id,
    })
    .select("id")
    .single();

  if (wErr || !workshop) {
    return { error: wErr?.message ?? "Workshop opslaan mislukt." };
  }

  const sessionRows = parsed.data.sessions.map((s) => {
    const iso = new Date(s.starts_at).toISOString();
    const loc = s.location?.trim();
    let priceCents: number | null = null;
    if (s.price_eur === "" || s.price_eur === undefined) {
      priceCents = defaultPriceCents;
    } else {
      priceCents = Math.round(Number(s.price_eur) * 100);
    }
    const desc = s.session_description?.trim();
    const extra = s.extra_info?.trim();
    const durationMinutes =
      s.duration_hours != null ? Math.round(s.duration_hours * 60) : null;
    return {
      workshop_id: workshop.id,
      starts_at: iso,
      location: loc || null,
      max_participants: s.max_participants,
      price_cents: priceCents,
      session_description: desc || null,
      duration_minutes: durationMinutes,
      extra_info: extra || null,
    };
  });

  const { error: sErr } = await supabase.from("workshop_sessions").insert(sessionRows);

  if (sErr) {
    return { error: sErr.message };
  }

  revalidatePath("/workshops");
  revalidatePath(`/workshops/${slug}`);
  revalidatePath("/dashboard/workshops");

  redirect(`/workshops/${slug}`);
}
