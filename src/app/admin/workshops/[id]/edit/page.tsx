import Link from "next/link";
import { notFound } from "next/navigation";

import { CancelSessionButton } from "@/components/admin/cancel-session-button";
import { Button } from "@/components/ui/button";
import { WorkshopCreateForm } from "@/components/workshops/workshop-create-form";
import { requireOwner } from "@/lib/auth/require-user";
import { updateWorkshopWithSessions } from "@/lib/actions/update-workshop";
import { createClient } from "@/lib/supabase/server";
import { toDatetimeLocalValue } from "@/lib/workshops/datetime-local";
import { fetchApprovedTeacherOptions } from "@/lib/workshops/fetch-approved-teachers";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

type SessionRow = {
  id: string;
  starts_at: string;
  location: string | null;
  max_participants: number;
  price_cents: number | null;
  session_description: string | null;
  duration_minutes: number | null;
  extra_info: string | null;
  teacher_user_id: string | null;
  status: "scheduled" | "cancelled";
};

export default async function AdminEditWorkshopPage({ params, searchParams }: Props) {
  await requireOwner("/admin/workshops");
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: workshop } = await supabase
    .from("workshops")
    .select("id, slug, title, description, price_cents")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      slug: string;
      title: string;
      description: string | null;
      price_cents: number | null;
    }>();

  if (!workshop) notFound();

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select(
      "id,starts_at,location,max_participants,price_cents,session_description,duration_minutes,extra_info,teacher_user_id,status",
    )
    .eq("workshop_id", workshop.id)
    .order("starts_at", { ascending: true })
    .returns<SessionRow[]>();

  const teacherOptions = await fetchApprovedTeacherOptions();
  const sessions = sessionsData ?? [];

  const initialSessions =
    sessions.length > 0
      ? sessions.map((s) => ({
          id: crypto.randomUUID(),
          dbId: s.id,
          starts_at: toDatetimeLocalValue(s.starts_at),
          location: s.location ?? "",
          max_participants: s.max_participants,
          price_eur: s.price_cents != null ? String(s.price_cents / 100) : "",
          session_description: s.session_description ?? "",
          duration_hours:
            s.duration_minutes != null ? String(Math.round((s.duration_minutes / 60) * 100) / 100) : "",
          extra_info: s.extra_info ?? "",
          teacher_user_id: s.teacher_user_id ?? teacherOptions[0]?.id ?? "",
        }))
      : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Workshop bewerken</h1>
        <p className="text-muted-foreground">{workshop.title}</p>
      </header>

      {query.ok === "saved" && (
        <p className="mb-6 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          Wijzigingen opgeslagen.
        </p>
      )}
      {query.ok === "session_cancelled" && (
        <p className="mb-6 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          Sessie geannuleerd. Deelnemers zijn per e-mail op de hoogte gebracht. Betaalde terugbetalingen
          verwerk je handmatig in Stripe.
        </p>
      )}
      {query.error === "already_cancelled" && (
        <p className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Deze sessie was al geannuleerd.
        </p>
      )}

      {teacherOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen docenten beschikbaar om toe te wijzen.</p>
      ) : (
        <WorkshopCreateForm
          teacherOptions={teacherOptions}
          action={updateWorkshopWithSessions}
          submitLabel="Wijzigingen opslaan"
          initial={{
            workshopId: workshop.id,
            title: workshop.title,
            slug: workshop.slug,
            description: workshop.description ?? "",
            default_price_eur:
              workshop.price_cents != null ? String(workshop.price_cents / 100) : "",
            sessions: initialSessions,
          }}
        />
      )}

      {sessions.some((s) => s.status === "scheduled") ? (
        <section className="mt-14 space-y-4 border-t border-border pt-10">
          <h2 className="text-lg font-semibold">Sessie annuleren</h2>
          <p className="text-sm text-muted-foreground">
            Annuleer een hele sessie. Alle openstaande boekingen worden geannuleerd. Terugbetalingen
            voor betaalde boekingen regel je handmatig.
          </p>
          <ul className="space-y-3">
            {sessions
              .filter((s) => s.status === "scheduled")
              .map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <span className="text-sm">
                    {new Date(s.starts_at).toLocaleString("nl-NL")}
                    {s.location ? ` · ${s.location}` : ""}
                  </span>
                  <CancelSessionButton sessionId={s.id} workshopId={workshop.id} />
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/admin/workshops">Terug naar overzicht</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/workshops/${workshop.slug}`}>Publieke pagina</Link>
        </Button>
      </div>
    </div>
  );
}
