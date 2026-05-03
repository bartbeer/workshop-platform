"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  type CreateWorkshopState,
  createWorkshopWithSessions,
} from "@/lib/actions/create-workshop";

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

export function WorkshopCreateForm() {
  const [state, formAction, pending] = useActionState<
    CreateWorkshopState | undefined,
    FormData
  >(createWorkshopWithSessions, undefined);

  const [sessions, setSessions] = useState<SessionDraft[]>(() => [newSession()]);

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

  return (
    <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-8">
      <input type="hidden" name="sessions_json" value={JSON.stringify(sessionsPayload)} />

      {state?.error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-4">
        <h2 className="text-base font-medium">Cursus</h2>
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input id="title" name="title" required placeholder="Bijv. Keramiek voor beginners" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (optioneel)</Label>
          <Input
            id="slug"
            name="slug"
            placeholder="Laat leeg om automatisch te genereren"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Beschrijving</Label>
          <Textarea id="description" name="description" rows={4} placeholder="Wat leren deelnemers?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_price_eur">Standaardprijs (EUR per persoon, optioneel)</Label>
          <Input
            id="default_price_eur"
            name="default_price_eur"
            type="number"
            min={0}
            step="0.01"
            placeholder="Bijv. 45"
          />
          <p className="text-xs text-muted-foreground">
            Prijs per deelnemer. Per sessie kun je afwijken; anders geldt dit bedrag.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Workshopafbeelding (optioneel)</Label>
          <Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
          <p className="text-xs text-muted-foreground">
            Aanbevolen formaat: 512 x 512 px. Toegestaan: PNG, JPG, WEBP (max 5 MB).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-medium">Datums en plaatsen</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSessions((s) => [...s, newSession()])}
          >
            Voeg een datum toe
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Kies zelf welke dagen en uren je geeft — geen vaste tussenpozen.
        </p>

        <div className="flex flex-col gap-4">
          {sessions.map((session, index) => (
            <div
              key={session.id}
              className="rounded-3xl border border-border bg-card/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Sessie {index + 1}</span>
                {sessions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSessions((rows) => rows.filter((r) => r.id !== session.id))
                    }
                  >
                    Verwijder
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`starts-${session.id}`}>Datum en tijd</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`loc-${session.id}`}>Locatie</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`max-${session.id}`}>Max. deelnemers</Label>
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
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`price-${session.id}`}>Prijs deze sessie (EUR per persoon, optioneel)</Label>
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
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`sess-desc-${session.id}`}>Focus van deze datum (optioneel)</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`dur-${session.id}`}>Duur (uren, optioneel)</Label>
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
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`extra-${session.id}`}>Extra info (optioneel)</Label>
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
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || sessionsPayload.length === 0}>
          {pending ? "Opslaan…" : "Workshop publiceren"}
        </Button>
        {sessionsPayload.length === 0 && (
          <p className="text-sm text-muted-foreground">Vul minstens één datum en tijd in.</p>
        )}
      </div>
    </form>
  );
}
