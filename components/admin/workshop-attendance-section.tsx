import { formatAttendanceSummary } from "@/lib/workshops/booking-attendance";
import { BookingAttendanceForm } from "@/components/teacher/booking-attendance-form";

type SessionSummary = {
  id: string;
  starts_at: string;
  location: string | null;
};

type BookingSummary = {
  id: string;
  workshop_session_id: string;
  participant_count: number;
  user_id: string;
};

type AttendanceSummary = {
  booking_id: string;
  present_count: number;
};

type BookerLabel = {
  user_id: string;
  label: string;
  email: string;
};

export function WorkshopAttendanceSection({
  sessions,
  bookings,
  attendanceByBookingId,
  bookerByUserId,
  redirectTo,
}: {
  sessions: SessionSummary[];
  bookings: BookingSummary[];
  attendanceByBookingId: Map<string, number>;
  bookerByUserId: Map<string, BookerLabel>;
  redirectTo: string;
}) {
  const sessionsWithBookings = sessions.filter((session) =>
    bookings.some((b) => b.workshop_session_id === session.id),
  );

  if (sessionsWithBookings.length === 0) return null;

  return (
    <section className="mt-14 space-y-4 border-t border-border pt-10">
      <h2 className="text-lg font-semibold">Aanwezigheid</h2>
      <p className="text-sm text-muted-foreground">
        Overzicht en registratie per boeking. Als Owner kun je aanwezigheid ook vóór sessiestart
        aanpassen.
      </p>
      <ul className="space-y-6">
        {sessionsWithBookings.map((session) => {
          const sessionBookings = bookings.filter((b) => b.workshop_session_id === session.id);
          return (
            <li key={session.id} className="rounded-xl border border-border px-4 py-4">
              <p className="text-sm font-medium">
                {new Date(session.starts_at).toLocaleString("nl-NL")}
                {session.location ? ` · ${session.location}` : ""}
              </p>
              <ul className="mt-3 space-y-2">
                {sessionBookings.map((booking) => {
                  const booker = bookerByUserId.get(booking.user_id);
                  const presentCount = attendanceByBookingId.get(booking.id) ?? null;
                  return (
                    <li key={booking.id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
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
                        canMark
                        redirectTo={redirectTo}
                      />
                      {presentCount == null ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatAttendanceSummary(null, booking.participant_count)}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
