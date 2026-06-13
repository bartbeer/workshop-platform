import Link from "next/link";

import { BookingAttendanceForm } from "@/components/teacher/booking-attendance-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProfileRole, requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { canMarkBookingAttendance } from "@/lib/workshops/booking-attendance-access";
import { isSessionOpenForAttendanceMarking } from "@/lib/workshops/booking-attendance";
import { isSessionStarted, isUpcomingSession } from "@/lib/workshops/teacher-session-view";

export const dynamic = "force-dynamic";

type AssignedSessionRow = {
  id: string;
  starts_at: string;
  location: string | null;
  max_participants: number;
  status: "scheduled" | "cancelled";
  teacher_user_id: string | null;
  workshops: { title: string; slug: string } | null;
};

type BookingRow = {
  id: string;
  workshop_session_id: string;
  participant_count: number;
  status: string;
  user_id: string;
};

type AttendanceRow = {
  booking_id: string;
  present_count: number;
};

type BookerLabelRow = {
  user_id: string;
  label: string;
  email: string;
};

type Props = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

function sessionListItem(
  session: AssignedSessionRow,
  sessionBookings: BookingRow[],
  bookerByUserId: Map<string, BookerLabelRow>,
  attendanceByBookingId: Map<string, number>,
  actorUserId: string,
  actorRole: Awaited<ReturnType<typeof getProfileRole>>,
  now: Date,
  allowOwnerEarlyMark: boolean,
) {
  const confirmedSpots = sessionBookings.reduce((sum, b) => sum + b.participant_count, 0);
  const canMarkSession =
    canMarkBookingAttendance({
      actorUserId,
      actorRole,
      sessionTeacherUserId: session.teacher_user_id,
    }) &&
    (allowOwnerEarlyMark ||
      isSessionOpenForAttendanceMarking(session.starts_at, now));

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
              const presentCount = attendanceByBookingId.get(booking.id) ?? null;
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
                  <BookingAttendanceForm
                    bookingId={booking.id}
                    participantCount={booking.participant_count}
                    presentCount={presentCount}
                    canMark={canMarkSession}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}

export default async function TeacherSessionsPage({ searchParams }: Props) {
  const user = await requireUser("/dashboard/sessions");
  const role = await getProfileRole(user.id);
  const query = await searchParams;

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
    .select(
      "id,starts_at,location,max_participants,status,teacher_user_id,workshops(title,slug)",
    )
    .eq("teacher_user_id", user.id)
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true })
    .returns<AssignedSessionRow[]>();

  const sessions = sessionsData ?? [];
  const upcoming = sessions.filter((s) => isUpcomingSession(s.starts_at, now));
  const forAttendance = sessions
    .filter((s) => isSessionStarted(s.starts_at, now))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  const allSessionIds = [...new Set([...upcoming, ...forAttendance].map((s) => s.id))];

  let bookings: BookingRow[] = [];
  if (allSessionIds.length) {
    const { data: bookingData } = await supabase
      .from("workshop_bookings")
      .select("id,workshop_session_id,participant_count,status,user_id")
      .in("workshop_session_id", allSessionIds)
      .eq("status", "confirmed")
      .returns<BookingRow[]>();
    bookings = bookingData ?? [];
  }

  const bookingIds = bookings.map((b) => b.id);
  let attendanceRows: AttendanceRow[] = [];
  if (bookingIds.length) {
    const { data: attendanceData } = await supabase
      .from("booking_attendance")
      .select("booking_id, present_count")
      .in("booking_id", bookingIds)
      .returns<AttendanceRow[]>();
    attendanceRows = attendanceData ?? [];
  }

  const bookerIds = [...new Set(bookings.map((b) => b.user_id))];
  const { data: bookerLabelsRaw } = bookerIds.length
    ? await supabase.rpc("booker_labels_by_user_ids", { p_user_ids: bookerIds })
    : { data: [] as BookerLabelRow[] };
  const bookerLabels = (bookerLabelsRaw ?? []) as BookerLabelRow[];
  const bookerByUserId = new Map(bookerLabels.map((b) => [b.user_id, b]));
  const attendanceByBookingId = new Map(attendanceRows.map((a) => [a.booking_id, a.present_count]));

  const bookingsBySession = new Map<string, BookingRow[]>();
  for (const booking of bookings) {
    const list = bookingsBySession.get(booking.workshop_session_id) ?? [];
    list.push(booking);
    bookingsBySession.set(booking.workshop_session_id, list);
  }

  const allowOwnerEarlyMark = role === "owner";

  return (
    <div className="content-layer mx-auto flex w-full max-w-3xl flex-col gap-10 px-8 py-16 md:py-24">
      <header className="space-y-3">
        <h1 className="font-headline text-4xl font-light">Mijn sessies</h1>
        <p className="font-body text-on-surface-variant text-lg font-light">
          Toegewezen sessies en aanwezigheidsregistratie.
        </p>
      </header>

      {query.ok === "attendance_saved" && (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          Aanwezigheid opgeslagen.
        </p>
      )}
      {query.error === "session_not_started" && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Aanwezigheid kan pas na aanvang van de sessie worden geregistreerd.
        </p>
      )}
      {query.error === "not_assigned" && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Je bent niet toegewezen aan deze sessie.
        </p>
      )}

      {upcoming.length === 0 && forAttendance.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen sessies toegewezen. De Owner wijst docenten toe per sessie.
        </p>
      ) : (
        <>
          {forAttendance.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Aanwezigheid registreren</h2>
              <ul className="space-y-6">
                {forAttendance.map((session) =>
                  sessionListItem(
                    session,
                    bookingsBySession.get(session.id) ?? [],
                    bookerByUserId,
                    attendanceByBookingId,
                    user.id,
                    role,
                    now,
                    allowOwnerEarlyMark,
                  ),
                )}
              </ul>
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Komende sessies</h2>
              <p className="text-sm text-muted-foreground">
                Aanwezigheid kan na aanvang van de sessie worden geregistreerd.
              </p>
              <ul className="space-y-6">
                {upcoming.map((session) =>
                  sessionListItem(
                    session,
                    bookingsBySession.get(session.id) ?? [],
                    bookerByUserId,
                    attendanceByBookingId,
                    user.id,
                    role,
                    now,
                    allowOwnerEarlyMark,
                  ),
                )}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
