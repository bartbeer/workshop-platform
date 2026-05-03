import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkshopSessionSubscribeForm } from "@/components/workshops/workshop-session-subscribe-form";
import { createClient } from "@/lib/supabase/server";
import { formatDurationNl } from "@/lib/workshops/format-duration";
import { workshopImageSrc } from "@/lib/workshops/image-url";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type WorkshopRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  image_path: string | null;
};

type SessionRow = {
  id: string;
  workshop_id: string;
  starts_at: string;
  location: string | null;
  max_participants: number;
  price_cents: number | null;
  session_description: string | null;
  duration_minutes: number | null;
  extra_info: string | null;
};

type SeatCountRpcRow = {
  workshop_session_id: string;
  total_participants: number;
};

type MyBookingRow = {
  id: string;
  workshop_session_id: string;
  participant_count: number;
  status: "pending" | "confirmed" | "cancelled";
};

export const dynamic = "force-dynamic";

function workshopQueryNotice(sp: Record<string, string | string[] | undefined>): string | null {
  const status = typeof sp.status === "string" ? sp.status : undefined;
  if (status === "subscribed") {
    return "Je bent ingeschreven.";
  }
  if (status === "cancelled") {
    return "Je annulering is doorgevoerd.";
  }

  const checkout = typeof sp.checkout === "string" ? sp.checkout : undefined;
  if (checkout === "success") {
    return "Betaling geslaagd. Je inschrijving wordt vastgezet; nieuwe accounts ontvangen een uitnodigingsmail om in te loggen.";
  }
  if (checkout === "cancel") {
    return "Je hebt de betaling afgebroken. Er is geen inschrijving geregistreerd.";
  }

  const err = typeof sp.error === "string" ? sp.error : undefined;
  if (err === "email_required") return "Vul een geldig e-mailadres in om verder te gaan.";
  if (err === "stripe_config") return "Online betalen is nog niet geconfigureerd (Stripe).";
  if (err === "stripe_session") return "Starten van de betaling mislukt. Probeer het later opnieuw.";
  if (err === "full") return "Deze sessie zit vol voor het gekozen aantal deelnemers.";
  if (err === "invalid") return "Ongeldige invoer. Pas het aantal deelnemers aan.";
  if (err === "missing_session") return "Deze sessie bestaat niet (meer).";
  if (err === "server_config") return "Inschrijving zonder account vereist serverconfiguratie (service role).";
  if (err === "booking_failed") return "Inschrijven is mislukt. Probeer het opnieuw of neem contact op.";

  return null;
}

export default async function WorkshopDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: workshop, error: workshopFetchError } = await supabase
    .from("workshops")
    .select("id,slug,title,description,price_cents,image_path")
    .eq("slug", slug)
    .maybeSingle<WorkshopRow>();

  if (workshopFetchError) {
    console.warn(
      "[workshops] detail query failed:",
      workshopFetchError.code ?? "(no code)",
      workshopFetchError.message,
      "slug:",
      slug,
    );
  }

  if (!workshop) notFound();

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select(
      "id,workshop_id,starts_at,location,max_participants,price_cents,session_description,duration_minutes,extra_info",
    )
    .eq("workshop_id", workshop.id)
    .order("starts_at", { ascending: true })
    .returns<SessionRow[]>();

  const sessions = sessionsData ?? [];
  const sessionIds = sessions.map((s) => s.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: seatRowsRaw } = sessionIds.length
    ? await supabase.rpc("confirmed_participants_by_sessions", {
        p_session_ids: sessionIds,
      })
    : { data: [] as SeatCountRpcRow[] };

  const seatRows = (seatRowsRaw ?? []) as SeatCountRpcRow[];

  const confirmedBySession = new Map<string, number>();
  seatRows.forEach((row) => {
    confirmedBySession.set(
      row.workshop_session_id,
      Number(row.total_participants),
    );
  });

  let myBookingsBySession = new Map<string, MyBookingRow>();
  if (user && sessionIds.length) {
    const { data: myBookingsData } = await supabase
      .from("workshop_bookings")
      .select("id,workshop_session_id,participant_count,status")
      .eq("user_id", user.id)
      .in("workshop_session_id", sessionIds)
      .returns<MyBookingRow[]>();

    myBookingsBySession = new Map((myBookingsData ?? []).map((b) => [b.workshop_session_id, b]));
  }

  const queryNotice = workshopQueryNotice(sp);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
      {queryNotice && (
        <p className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
          {queryNotice}
        </p>
      )}
      <div>
        <Image
          src={workshopImageSrc(workshop.image_path)}
          alt={`Afbeelding voor workshop ${workshop.title}`}
          width={512}
          height={512}
          className="mb-4 h-36 w-36 rounded-xl border border-border object-cover"
        />
        <h1 className="text-2xl font-semibold tracking-tight">{workshop.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {workshop.description ?? "Beschrijving volgt binnenkort."}
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Er zijn nog geen datums beschikbaar voor deze cursus.
        </p>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const confirmed = confirmedBySession.get(session.id) ?? 0;
            const free = Math.max(session.max_participants - confirmed, 0);
            const myBooking = myBookingsBySession.get(session.id);
            const isConfirmed = myBooking?.status === "confirmed";

            const durationLabel = formatDurationNl(session.duration_minutes);
            const pricePerPersonCents = session.price_cents ?? workshop.price_cents;
            const priceLabel =
              pricePerPersonCents != null
                ? `€ ${(pricePerPersonCents / 100).toFixed(2).replace(".", ",")} per persoon`
                : "Prijs volgt";

            return (
              <div key={session.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{new Date(session.starts_at).toLocaleString("nl-NL")}</Badge>
                  {session.location && <Badge variant="secondary">{session.location}</Badge>}
                  {durationLabel && <Badge variant="outline">{durationLabel}</Badge>}
                  <Badge variant="outline">{free} van {session.max_participants} vrij</Badge>
                  <Badge variant="outline">{priceLabel}</Badge>
                </div>

                {session.session_description?.trim() && (
                  <p className="mt-3 text-sm leading-relaxed">{session.session_description.trim()}</p>
                )}

                {session.extra_info?.trim() && (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {session.extra_info.trim()}
                  </p>
                )}

                {isConfirmed && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Je bent ingeschreven met {myBooking.participant_count} deelnemer(s).
                  </p>
                )}

                <WorkshopSessionSubscribeForm
                  slug={workshop.slug}
                  sessionId={session.id}
                  pricePerPersonCents={pricePerPersonCents}
                  defaultParticipantCount={
                    isConfirmed && myBooking ? myBooking.participant_count : 1
                  }
                  disableSubmit={free === 0 && !isConfirmed}
                  isConfirmed={isConfirmed}
                  isLoggedIn={!!user}
                />
              </div>
            );
          })}
        </div>
      )}

      <Button variant="outline" asChild>
        <Link href="/workshops">Alle workshops</Link>
      </Button>
    </div>
  );
}