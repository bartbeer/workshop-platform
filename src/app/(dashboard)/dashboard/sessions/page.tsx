import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfileRole, requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { isUpcomingSession } from "@/lib/workshops/teacher-session-view";

export const dynamic = "force-dynamic";

type AssignedSessionRow = {
  id: string;
  starts_at: string;
  location: string | null;
  max_participants: number;
  status: "scheduled" | "cancelled";
  workshops: { title: string; slug: string } | null;
};

type BookingRow = {
  id: string;
  workshop_session_id: string;
  participant_count: number;
  status: string;
  user_id: string;
};

type BookerLabelRow = {
  user_id: string;
  label: string;
  email: string;
};

export default async function TeacherSessionsPage() {
  const user = await requireUser("/dashboard/sessions");
  const role = await getProfileRole(user.id);

  if (role !== "teacher" && role !== "owner") {
    return (
      <div className="content-layer mx-auto max-w-3xl px-8 py-16">
        <p className="text-sm">Deze pagina is alleen voor docenten.</p>
        <Button asChild variant="outline" className="mt-4 rounded-none">
          <Link href="/dashboard">Terug</Link>
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  const now = new Date();

  const { data: sessionsData } = await supabase
    .from("workshop_sessions")
    .select("id,starts_at,location,max_participants,status,workshops(title,slug)")
    .eq("teacher_user_id", user.id)
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true })
    .returns<AssignedSessionRow[]>();

  const upcoming = (sessionsData ?? []).filter((s) => isUpcomingSession(s.starts_at, now));
  const sessionIds = upcoming.map((s) => s.id);

  let bookings: BookingRow[] = [];
  if (sessionIds.length) {
    const { data: bookingData } = await supabase
      .from("workshop_bookings")
      .select("id,workshop_session_id,participant_count,status,user_id")
      .in("workshop_session_id", sessionIds)
      .eq("status", "confirmed")
      .returns<BookingRow[]>();
    bookings = bookingData ?? [];
  }

  const bookerIds = [...new Set(bookings.map((b) => b.user_id))];
  const { data: bookerLabelsRaw } = bookerIds.length
    ? await supabase.rpc("booker_labels_by_user_ids", { p_user_ids: bookerIds })
    : { data: [] as BookerLabelRow[] };
  const bookerLabels = (bookerLabelsRaw ?? []) as BookerLabelRow[];
  const bookerByUserId = new Map(bookerLabels.map((b) => [b.user_id, b]));

  const bookingsBySession = new Map<string, BookingRow[]>();
  for (const booking of bookings) {
    const list = bookingsBySession.get(booking.workshop_session_id) ?? [];
    list.push(booking);
    bookingsBySession.set(booking.workshop_session_id, list);
  }

  return (
    <div className="content-layer mx-auto flex w-full max-w-3xl flex-col gap-10 px-8 py-16 md:py-24">
      <header className="space-y-3">
        <h1 className="font-headline text-4xl font-light">Mijn sessies</h1>
        <p className="font-body text-on-surface-variant text-lg font-light">
          Sessies waaraan je bent toegewezen — alleen-lezen.
        </p>
      </header>

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen komende sessies toegewezen. De Owner wijst docenten toe per sessie.
        </p>
      ) : (
        <ul className="space-y-6">
          {upcoming.map((session) => {
            const sessionBookings = bookingsBySession.get(session.id) ?? [];
            const confirmedSpots = sessionBookings.reduce((sum, b) => sum + b.participant_count, 0);

            return (
              <li
                key={session.id}
                className="border-outline-variant/30 rounded-none border bg-white/90 px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{session.workshops?.title ?? "Workshop"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.starts_at).toLocaleString("nl-NL")}
                      {session.location ? ` · ${session.location}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {confirmedSpots} / {session.max_participants} plaatsen
                  </Badge>
                </div>

                {session.workshops?.slug ? (
                  <Link
                    href={`/workshops/${session.workshops.slug}`}
                    className="mt-2 inline-block text-xs underline"
                  >
                    Publieke pagina
                  </Link>
                ) : null}

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold tracking-wide uppercase">Boekingen</p>
                  {sessionBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nog geen bevestigde boekingen.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {sessionBookings.map((booking) => {
                        const booker = bookerByUserId.get(booking.user_id);
                        return (
                          <li key={booking.id} className="rounded-lg bg-muted/30 px-3 py-2">
                            <span className="font-medium">{booker?.label ?? "Deelnemer"}</span>
                            {booker?.email ? (
                              <span className="text-muted-foreground"> · {booker.email}</span>
                            ) : null}
                            <span className="text-muted-foreground">
                              {" "}
                              · {booking.participant_count} plaats(en)
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
