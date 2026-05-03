import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { WorkshopSessionSubscribeForm } from "@/components/workshops/workshop-session-subscribe-form";
import { createClient } from "@/lib/supabase/server";
import { formatDurationNl } from "@/lib/workshops/format-duration";
import { workshopImageSrc } from "@/lib/workshops/image-url";

/** Accentbeelden — zelfde sfeer als de homepage (`src/app/(marketing)/page.tsx`). */
const GALLERY_ACCENT_A =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXc8H9LvMGPoRM95hHJnmIy4sTLZo1iKXBZZJyW91sMrhFZzxYiT9SXTQ-V2zSeVv7kPIlZxDBgygqeF1rIQaklj-gYDUKUjba_z9jQiogt57C_Txkj42EVRxRjgvlv4Z8-oZiu0lmTIL5FDhXGqxqypjG7SzegL1Ji7lB_KcPkBfzAtKATjsayQP8Ffp17UT6ZZ5LAqPedAf7nGBDqQ8eABt89zrJTqcyp0a8HB6Pnv8h5Tw64R45vhyEyGpgjlhRtxlSZh14Vji_1";
const GALLERY_ACCENT_B =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCP25PO_drLwUzwBaFSjaTwsOSqZ4lZJQNJD56SsBiIoV18HMp_l6LZITA8kd_Klzqb9X0iFQ0ZG372ybAGRqvIcg52_Hb_INzlqYjM_X4OtzUagZDlfKgynME9WYeHjjTzPeCZETH2On_Co5oQBZgdlT9QXML3MgMvoQVe1DDEzGb-91DGwliyJVXR9-rmAH75IWQ1wcplCK4w_GzwwH8nIoWHiiRE0UXR4BC7vSI2XCRcRG4bcxCrV3Yr0ewo6hGGPEBUzHmOrj78";

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

function formatEurFromCents(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function formatSessionClock(startsAt: string): string {
  return new Date(startsAt).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSessionLongDate(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSessionShortHeading(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sessionTimeRangeLabel(startsAt: string, durationMinutes: number | null): string {
  const start = formatSessionClock(startsAt);
  if (!durationMinutes || durationMinutes <= 0) return start;
  const end = new Date(startsAt);
  end.setMinutes(end.getMinutes() + durationMinutes);
  const endClock = end.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  return `${start} tot ${endClock} uur`;
}

function summarizeWhenBlock(sessions: SessionRow[]): string {
  if (sessions.length === 0) return "Er zijn nog geen concrete datums voor deze workshop.";
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const first = sorted[0]!;
  if (sessions.length === 1) {
    const range = sessionTimeRangeLabel(first.starts_at, first.duration_minutes);
    const dur = formatDurationNl(first.duration_minutes);
    const durLine = dur ? `\n(${dur})` : "";
    return `${formatSessionLongDate(first.starts_at)}\n${range}${durLine}`;
  }
  return `${sessions.length} geplande datums.\n\nVolgende: ${formatSessionLongDate(first.starts_at)}\n${sessionTimeRangeLabel(first.starts_at, first.duration_minutes)}`;
}

function summarizeLocations(sessions: SessionRow[]): string {
  const locs = [
    ...new Set(
      sessions.map((s) => s.location?.trim()).filter((x): x is string => Boolean(x?.length)),
    ),
  ];
  if (locs.length === 0) return "Locatie wordt per sessie bevestigd — zie hieronder.";
  return locs.join("\n\n");
}

function summarizeIncluded(sessions: SessionRow[], workshopDescription: string | null): string {
  const extras = [
    ...new Set(
      sessions.map((s) => s.extra_info?.trim()).filter((x): x is string => Boolean(x?.length)),
    ),
  ];
  if (extras.length > 0) return extras.join("\n\n");
  const hint =
    workshopDescription?.replace(/\s+/g, " ").trim().slice(0, 220) ??
    "Alle sessie-info, capaciteit en inschrijving vind je hieronder bij elke datum.";
  return hint;
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

  const heroSrc = workshopImageSrc(workshop.image_path);
  const displayPriceCents =
    workshop.price_cents ??
    sessions.map((s) => s.price_cents).find((c): c is number => c != null) ??
    null;

  const eyebrow =
    sessions.length === 0
      ? "Workshop"
      : sessions.length === 1
        ? "Eén geplande datum"
        : `${sessions.length} datums`;

  const whenSummary = summarizeWhenBlock(sessions);
  const locationSummary = summarizeLocations(sessions);
  const includedSummary = summarizeIncluded(sessions, workshop.description);

  return (
    <div className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute top-40 -right-20 z-[2] hidden h-96 w-96 rounded-full bg-secondary-container opacity-15 blur-[80px] md:block" />
      <div className="pointer-events-none absolute bottom-1/4 -left-20 z-[2] hidden h-[500px] w-[500px] rounded-full bg-primary-fixed-dim opacity-10 blur-[80px] md:block" />

      <div className="content-layer relative z-[40] px-8 pt-28">
        {queryNotice ? (
          <p className="border-outline-variant/40 bg-white/90 mx-auto mb-10 max-w-3xl rounded-none border px-4 py-3 text-center text-sm text-on-surface backdrop-blur-sm">
            {queryNotice}
          </p>
        ) : null}

        {/* Hero */}
        <section className="mx-auto max-w-screen-2xl pb-16 md:pb-20">
          <div className="group relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-surface-container-low">
            <Image
              src={heroSrc}
              alt={`Workshop ${workshop.title}`}
              fill
              priority
              className="object-cover grayscale transition-all duration-700 group-hover:scale-[1.02] group-hover:grayscale-0"
              sizes="(max-width: 1536px) 100vw, 1536px"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/25 p-6 md:bg-black/20 md:p-12">
              <span className="font-label mb-3 text-xs font-medium tracking-[0.2em] text-white/85 uppercase">
                {eyebrow}
              </span>
              <h1 className="font-headline max-w-4xl text-4xl leading-[0.95] font-light text-white italic md:text-6xl lg:text-7xl xl:text-8xl">
                {workshop.title}
              </h1>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 md:mt-12 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-7">
              <p className="font-headline text-on-surface text-xl leading-relaxed opacity-90 md:text-2xl">
                {workshop.description?.trim() ?? "Beschrijving volgt binnenkort."}
              </p>
            </div>
            <div className="md:col-span-5 flex flex-col items-start justify-end md:items-end">
              <div className="mb-2 flex items-center gap-4">
                {displayPriceCents != null ? (
                  <>
                    <span className="font-headline text-4xl">{formatEurFromCents(displayPriceCents)}</span>
                    <span className="text-sm text-on-surface/60">p.p. (indien niet anders vermeld)</span>
                  </>
                ) : (
                  <span className="font-headline text-2xl text-on-surface/70">Prijs per sessie</span>
                )}
              </div>
              <Link
                href="#sessies-inschrijven"
                className="font-label bg-japandi-blue hover:brightness-110 inline-block px-10 py-4 text-xs font-bold tracking-widest text-white uppercase shadow-md transition-all duration-300 hover:opacity-95 active:scale-[0.98]"
              >
                Schrijf nu in
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Bento — volle breedte zoals homepage-secties */}
      <section className="bg-surface-container py-16 md:py-24">
        <div className="content-layer relative z-[40] mx-auto max-w-screen-2xl px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-xl bg-surface p-8 transition-colors md:p-10">
                <div className="bg-surface-container-highest mb-6 flex h-12 w-12 items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-japandi-blue text-[26px]">
                    calendar_today
                  </span>
                </div>
                <h3 className="font-headline mb-2 text-2xl italic">Wanneer</h3>
                <p className="font-body whitespace-pre-line leading-relaxed opacity-70">{whenSummary}</p>
              </div>
              <div className="rounded-xl bg-surface p-8 md:p-10">
                <div className="bg-surface-container-highest mb-6 flex h-12 w-12 items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-japandi-blue text-[26px]">
                    location_on
                  </span>
                </div>
                <h3 className="font-headline mb-2 text-2xl italic">Locatie</h3>
                <p className="font-body whitespace-pre-line leading-relaxed opacity-70">{locationSummary}</p>
              </div>
              <div className="rounded-xl bg-surface p-8 md:p-10">
                <div className="bg-surface-container-highest mb-6 flex h-12 w-12 items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-japandi-blue text-[26px]">
                    inventory_2
                  </span>
                </div>
                <h3 className="font-headline mb-2 text-2xl italic">Praktisch</h3>
                <p className="font-body whitespace-pre-line leading-relaxed opacity-70">{includedSummary}</p>
              </div>
          </div>
        </div>
      </section>

      <div className="content-layer relative z-[40] px-8">
        {/* Programma + beelden */}
        <section className="mx-auto grid max-w-screen-2xl grid-cols-1 items-start gap-16 py-20 lg:grid-cols-2 lg:gap-24 lg:py-32">
          <div id="sessies-inschrijven">
            <h2 className="font-headline decoration-japandi-blue/20 mb-10 text-3xl italic underline underline-offset-8 md:text-4xl">
              Sessies &amp; inschrijving
            </h2>

            {sessions.length === 0 ? (
              <p className="font-body rounded-xl border border-outline-variant/30 bg-surface-container-low/80 px-4 py-3 text-sm text-on-surface-variant">
                Er zijn nog geen datums beschikbaar voor deze cursus.
              </p>
            ) : (
              <div className="space-y-0">
                {sessions.map((session, index) => {
                  const confirmed = confirmedBySession.get(session.id) ?? 0;
                  const free = Math.max(session.max_participants - confirmed, 0);
                  const myBooking = myBookingsBySession.get(session.id);
                  const isConfirmed = myBooking?.status === "confirmed";

                  const durationLabel = formatDurationNl(session.duration_minutes);
                  const pricePerPersonCents = session.price_cents ?? workshop.price_cents;
                  const priceLabel =
                    pricePerPersonCents != null
                      ? `${formatEurFromCents(pricePerPersonCents)} per persoon`
                      : "Prijs volgt";

                  const clock = formatSessionClock(session.starts_at);
                  const borderClass =
                    index < sessions.length - 1 ? "border-b border-outline-variant/20" : "";

                  return (
                    <div
                      key={session.id}
                      className={`font-body group hover:bg-surface-container-low -mx-4 rounded-lg px-4 py-8 transition-colors ${borderClass}`}
                    >
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                        <span className="font-headline text-japandi-teal shrink-0 text-xl opacity-60">
                          {clock}
                        </span>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <h4 className="font-body mb-1 text-lg font-bold text-on-surface">
                              {formatSessionShortHeading(session.starts_at)}
                            </h4>
                            <p className="text-sm opacity-60">
                              {sessionTimeRangeLabel(session.starts_at, session.duration_minutes)}
                              {durationLabel ? ` · ${durationLabel}` : ""}
                              {session.location?.trim()
                                ? ` · ${session.location.trim()}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="font-label border-outline-variant/40 rounded-none border bg-white/80 px-2 py-1 text-[10px] tracking-wide uppercase">
                              {priceLabel}
                            </span>
                            <span className="font-label border-outline-variant/40 rounded-none border bg-white/80 px-2 py-1 text-[10px] tracking-wide uppercase">
                              {free} van {session.max_participants} vrij
                            </span>
                          </div>

                          {session.session_description?.trim() ? (
                            <p className="text-sm leading-relaxed opacity-80">
                              {session.session_description.trim()}
                            </p>
                          ) : null}

                          {session.extra_info?.trim() ? (
                            <p className="text-sm whitespace-pre-wrap text-on-surface-variant">
                              {session.extra_info.trim()}
                            </p>
                          ) : null}

                          {isConfirmed ? (
                            <p className="text-sm text-japandi-teal">
                              Je bent ingeschreven met {myBooking.participant_count} deelnemer(s).
                            </p>
                          ) : null}

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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative grid grid-cols-2 gap-6">
            <div className="border-japandi-teal/20 absolute -top-12 -left-12 hidden h-24 w-24 border-t-2 border-l-2 xl:block" />
            <div className="space-y-6">
              <div className="group relative h-80 overflow-hidden rounded-lg bg-surface-container-low">
                <Image
                  src={heroSrc}
                  alt={`Sfeer — ${workshop.title}`}
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  sizes="(max-width: 1024px) 45vw, 380px"
                />
              </div>
              <div className="group relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={GALLERY_ACCENT_A}
                  alt="Ambacht in de studio"
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  sizes="(max-width: 1024px) 45vw, 380px"
                />
              </div>
            </div>
            <div className="space-y-6 pt-10 md:pt-12">
              <div className="group relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={GALLERY_ACCENT_B}
                  alt="Locatie Makerslabo"
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  sizes="(max-width: 1024px) 45vw, 380px"
                />
              </div>
              <div className="group relative h-80 overflow-hidden rounded-lg bg-surface-container-low">
                <Image
                  src={heroSrc}
                  alt={`Atelier — ${workshop.title}`}
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  sizes="(max-width: 1024px) 45vw, 380px"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-screen-2xl pb-8">
          <Button variant="outline" className="rounded-none font-label text-[10px] tracking-widest uppercase" asChild>
            <Link href="/workshops">Alle workshops</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
