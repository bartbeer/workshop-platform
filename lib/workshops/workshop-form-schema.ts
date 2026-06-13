import { z } from "zod";

export const workshopSessionFormSchema = z.object({
  starts_at: z.string().min(1, "Kies datum en tijd"),
  location: z.string().optional(),
  max_participants: z.coerce.number().int().min(1).max(500),
  price_eur: z.union([z.number(), z.literal("")]).optional(),
  session_description: z.string().max(8000).optional(),
  duration_hours: z.number().min(0.25).max(48).optional(),
  extra_info: z.string().max(8000).optional(),
  teacher_user_id: z.string().uuid("Kies een docent per sessie"),
});

export const workshopFormPayloadSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  slug: z.string().optional(),
  description: z.string().optional(),
  default_price_eur: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
  sessions: z.array(workshopSessionFormSchema).min(1, "Voeg minstens één datum toe"),
});

export type WorkshopSessionFormInput = z.infer<typeof workshopSessionFormSchema>;
export type WorkshopFormPayload = z.infer<typeof workshopFormPayloadSchema>;

export function parseWorkshopFormPayload(input: {
  title: FormDataEntryValue | null;
  slug: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  default_price_eur: FormDataEntryValue | null;
  sessions: unknown;
}):
  | { ok: true; data: WorkshopFormPayload }
  | { ok: false; error: string } {
  let sessionsParsed: unknown = input.sessions;
  if (typeof sessionsParsed === "string") {
    try {
      sessionsParsed = JSON.parse(sessionsParsed || "[]");
    } catch {
      return { ok: false, error: "Ongeldige sessiedata." };
    }
  }

  const parsed = workshopFormPayloadSchema.safeParse({
    title: input.title,
    slug: input.slug,
    description: input.description,
    default_price_eur: input.default_price_eur,
    sessions: sessionsParsed,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  return { ok: true, data: parsed.data };
}

export function mapSessionFormToRows(
  sessions: WorkshopSessionFormInput[],
  workshopId: string,
  defaultPriceCents: number | null,
): Array<{
  workshop_id: string;
  starts_at: string;
  location: string | null;
  max_participants: number;
  price_cents: number | null;
  session_description: string | null;
  duration_minutes: number | null;
  extra_info: string | null;
  teacher_user_id: string;
  status: "scheduled";
}> {
  return sessions.map((s) => {
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
      workshop_id: workshopId,
      starts_at: iso,
      location: loc || null,
      max_participants: s.max_participants,
      price_cents: priceCents,
      session_description: desc || null,
      duration_minutes: durationMinutes,
      extra_info: extra || null,
      teacher_user_id: s.teacher_user_id,
      status: "scheduled" as const,
    };
  });
}
