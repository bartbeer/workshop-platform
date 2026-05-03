"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  type CreateWorkshopState,
  createWorkshopWithSessions,
} from "@/lib/actions/create-workshop";
import {
  WORKSHOP_IMAGE_ACCEPT_ATTR,
  WORKSHOP_IMAGE_MAX_BYTES,
  WORKSHOP_IMAGE_PIXEL_SIZE,
  workshopImageFilenameAllowed,
  workshopImageMimeAllowed,
} from "@/lib/workshops/workshop-image-rules";

type SessionDraft = {
  id: string;
  starts_at: string;
  location: string;
  max_participants: number;
  price_eur: string;
  session_description: string;
  duration_hours: string;
  extra_info: string;
};

function newSession(): SessionDraft {
  return {
    id: crypto.randomUUID(),
    starts_at: "",
    location: "",
    max_participants: 12,
    price_eur: "",
    session_description: "",
    duration_hours: "",
    extra_info: "",
  };
}

function readImageNaturalSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="bg-outline/25 hidden h-px w-10 shrink-0 sm:block" />
      <span className="font-label text-outline text-[10px] font-bold tracking-[0.25em] uppercase">
        {label}
      </span>
      <div className="bg-outline/25 h-px min-w-[2rem] flex-1" />
    </div>
  );
}

export function WorkshopCreateForm() {
  const [state, formAction, pending] = useActionState<
    CreateWorkshopState | undefined,
    FormData
  >(createWorkshopWithSessions, undefined);

  const [sessions, setSessions] = useState<SessionDraft[]>(() => [newSession()]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFieldError, setImageFieldError] = useState<string | null>(null);
  const imageObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
    };
  }, []);

  const sessionsPayload = useMemo(() => {
    return sessions
      .filter((s) => s.starts_at.trim() !== "")
      .map((s) => {
        const raw = s.price_eur.trim();
        let price_eur: number | "" = "";
        if (raw !== "") {
          const n = Number(raw.replace(",", "."));
          if (!Number.isNaN(n)) price_eur = n;
        }
        const dhRaw = s.duration_hours.trim();
        let duration_hours: number | undefined;
        if (dhRaw !== "") {
          const n = Number(dhRaw.replace(",", "."));
          if (!Number.isNaN(n) && n >= 0.25) duration_hours = n;
        }
        const base: {
          starts_at: string;
          location?: string;
          max_participants: number;
          price_eur: number | "";
          session_description?: string;
          extra_info?: string;
          duration_hours?: number;
        } = {
          starts_at: s.starts_at,
          location: s.location.trim() || undefined,
          max_participants: s.max_participants,
          price_eur,
        };
        const sd = s.session_description.trim();
        if (sd) base.session_description = sd;
        const ex = s.extra_info.trim();
        if (ex) base.extra_info = ex;
        if (duration_hours != null) base.duration_hours = duration_hours;
        return base;
      });
  }, [sessions]);

  async function onWorkshopImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    setImageFieldError(null);

    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    setImagePreviewUrl(null);

    if (!file || file.size === 0) return;

    if (!workshopImageFilenameAllowed(file.name)) {
      setImageFieldError("Alleen bestanden met extensie .png, .jpg, .jpeg of .webp.");
      input.value = "";
      return;
    }

    if (file.size > WORKSHOP_IMAGE_MAX_BYTES) {
      setImageFieldError("Bestand is te groot (maximaal 5 MB).");
      input.value = "";
      return;
    }

    if (!workshopImageMimeAllowed(file.type)) {
      setImageFieldError("Kies een PNG-, JPG- of WEBP-afbeelding.");
      input.value = "";
      return;
    }

    const dims = await readImageNaturalSize(file);
    if (
      !dims ||
      dims.width !== WORKSHOP_IMAGE_PIXEL_SIZE ||
      dims.height !== WORKSHOP_IMAGE_PIXEL_SIZE
    ) {
      setImageFieldError(
        `De afbeelding moet exact ${WORKSHOP_IMAGE_PIXEL_SIZE} × ${WORKSHOP_IMAGE_PIXEL_SIZE} pixels zijn.`,
      );
      input.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    imageObjectUrlRef.current = url;
    setImagePreviewUrl(url);
  }

  const fieldClass =
    "border-outline-variant/40 bg-white/80 rounded-none font-body text-japandi-charcoal placeholder:text-muted-foreground focus-visible:border-japandi-blue/50";

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="flex flex-col gap-12"
      onSubmit={() => setImageFieldError(null)}
    >
      <input type="hidden" name="sessions_json" value={JSON.stringify(sessionsPayload)} />

      {state?.error && (
        <p className="border-error/40 bg-error-container/60 font-body text-error rounded-none border px-4 py-3 text-sm">
          {state.error}
        </p>
      )}

      <div className="border-outline-variant/25 shadow-japandi-charcoal/5 rounded-none border bg-white/45 p-6 backdrop-blur-sm md:p-10">
        <SectionTitle label="Cursus" />
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase">
              Titel
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Bijv. Keramiek voor beginners"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase">
              Slug (optioneel)
            </Label>
            <Input
              id="slug"
              name="slug"
              placeholder="Laat leeg om automatisch te genereren"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase">
              Beschrijving
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Wat leren deelnemers?"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="default_price_eur"
              className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
            >
              Standaardprijs (EUR per persoon, optioneel)
            </Label>
            <Input
              id="default_price_eur"
              name="default_price_eur"
              type="number"
              min={0}
              step="0.01"
              placeholder="Bijv. 45"
              className={fieldClass}
            />
            <p className="font-body text-on-surface-variant text-xs font-light">
              Prijs per deelnemer. Per sessie kun je afwijken; anders geldt dit bedrag.
            </p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="image" className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase">
              Workshopafbeelding (optioneel)
            </Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept={WORKSHOP_IMAGE_ACCEPT_ATTR}
              onChange={onWorkshopImageSelected}
              className={`${fieldClass} cursor-pointer file:font-label file:text-japandi-blue file:mr-4 file:border-0 file:bg-transparent file:text-[10px] file:font-bold file:tracking-widest file:uppercase`}
            />
            <p className="font-body text-on-surface-variant text-xs font-light">
              Exact{" "}
              <span className="text-japandi-charcoal font-medium">
                {WORKSHOP_IMAGE_PIXEL_SIZE} × {WORKSHOP_IMAGE_PIXEL_SIZE} px
              </span>
              . Toegestane extensies: PNG, JPG, JPEG, WEBP (max 5 MB). Zo komt je beeld overeen met de
              workshopkaarten op de site.
            </p>
            {imageFieldError ? (
              <p className="font-body text-error text-sm">{imageFieldError}</p>
            ) : null}
            {imagePreviewUrl ? (
              <div className="border-outline-variant/30 mt-4 inline-block border bg-white/90 p-2">
                <div className="border-outline-variant/20 relative aspect-square w-full max-w-[min(100%,280px)] overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob-preview */}
                  <img
                    src={imagePreviewUrl}
                    alt="Voorbeeld workshopafbeelding"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="font-label text-outline mt-2 text-[9px] tracking-wider uppercase">
                  Voorbeeld ({WORKSHOP_IMAGE_PIXEL_SIZE} × {WORKSHOP_IMAGE_PIXEL_SIZE} px)
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-outline-variant/25 shadow-japandi-charcoal/5 rounded-none border bg-white/45 p-6 backdrop-blur-sm md:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="bg-outline/25 hidden h-px w-10 shrink-0 sm:block" />
            <span className="font-label text-outline text-[10px] font-bold tracking-[0.25em] uppercase">
              Datums en plaatsen
            </span>
            <div className="bg-outline/25 h-px min-w-[2rem] flex-1 max-sm:hidden" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSessions((s) => [...s, newSession()])}
            className="border-japandi-blue/35 font-label shrink-0 rounded-none text-[10px] tracking-widest uppercase"
          >
            Voeg een datum toe
          </Button>
        </div>

        <p className="font-body text-on-surface-variant mb-6 text-sm font-light">
          Kies zelf welke dagen en uren je geeft — geen vaste tussenpozen.
        </p>

        <div className="flex flex-col gap-5">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className="border-outline-variant/30 bg-white/65 rounded-none border p-4 backdrop-blur-sm md:p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="font-headline text-japandi-charcoal text-lg font-medium">
                  Sessie {index + 1}
                </span>
                {sessions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="font-label text-japandi-terracotta text-[10px] tracking-widest uppercase"
                    onClick={() =>
                      setSessions((rows) => rows.filter((r) => r.id !== session.id))
                    }
                  >
                    Verwijder
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor={`starts-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Datum en tijd
                  </Label>
                  <Input
                    id={`starts-${session.id}`}
                    type="datetime-local"
                    value={session.starts_at}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id ? { ...r, starts_at: e.target.value } : r,
                        ),
                      )
                    }
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`loc-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Locatie
                  </Label>
                  <Input
                    id={`loc-${session.id}`}
                    value={session.location}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id ? { ...r, location: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="Stad of adres"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`max-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Max. deelnemers
                  </Label>
                  <Input
                    id={`max-${session.id}`}
                    type="number"
                    min={1}
                    max={500}
                    value={session.max_participants}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id
                            ? { ...r, max_participants: Number(e.target.value) || 1 }
                            : r,
                        ),
                      )
                    }
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor={`price-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Prijs deze sessie (EUR per persoon, optioneel)
                  </Label>
                  <Input
                    id={`price-${session.id}`}
                    value={session.price_eur}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id ? { ...r, price_eur: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="Leeg = standaardprijs"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor={`sess-desc-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Focus van deze datum (optioneel)
                  </Label>
                  <Textarea
                    id={`sess-desc-${session.id}`}
                    value={session.session_description}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id ? { ...r, session_description: e.target.value } : r,
                        ),
                      )
                    }
                    rows={2}
                    placeholder="Bijv. deze sessie: glazuren — andere datum: stoken"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`dur-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Duur (uren, optioneel)
                  </Label>
                  <Input
                    id={`dur-${session.id}`}
                    type="number"
                    min={0.25}
                    max={48}
                    step={0.25}
                    value={session.duration_hours}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id ? { ...r, duration_hours: e.target.value } : r,
                        ),
                      )
                    }
                    placeholder="Bijv. 3"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label
                    htmlFor={`extra-${session.id}`}
                    className="font-label text-japandi-charcoal text-[10px] tracking-widest uppercase"
                  >
                    Extra info (optioneel)
                  </Label>
                  <Textarea
                    id={`extra-${session.id}`}
                    value={session.extra_info}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) =>
                          r.id === session.id ? { ...r, extra_info: e.target.value } : r,
                        ),
                      )
                    }
                    rows={2}
                    placeholder="Wat meebrengen, kledij, voorbereiding, …"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={pending || sessionsPayload.length === 0}
          className="font-label bg-japandi-blue hover:bg-japandi-blue/90 h-auto rounded-none px-8 py-3 text-[10px] font-bold tracking-[0.2em] text-white uppercase shadow-lg disabled:opacity-40"
        >
          {pending ? "Opslaan…" : "Workshop publiceren"}
        </Button>
        {sessionsPayload.length === 0 && (
          <p className="font-body text-on-surface-variant text-sm font-light">
            Vul minstens één datum en tijd in.
          </p>
        )}
      </div>
    </form>
  );
}
