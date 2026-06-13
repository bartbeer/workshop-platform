"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { markBookingAttendance } from "@/lib/actions/mark-booking-attendance";
import { formatAttendanceSummary } from "@/lib/workshops/booking-attendance";

export function BookingAttendanceForm({
  bookingId,
  participantCount,
  presentCount,
  canMark,
  redirectTo = "/dashboard/sessions",
}: {
  bookingId: string;
  participantCount: number;
  presentCount: number | null;
  canMark: boolean;
  redirectTo?: string;
}) {
  if (!canMark) {
    return (
      <p className="text-xs text-muted-foreground">
        {formatAttendanceSummary(presentCount, participantCount)}
      </p>
    );
  }

  const options = Array.from({ length: participantCount + 1 }, (_, i) => i);

  return (
    <form action={markBookingAttendance} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <label className="text-xs text-muted-foreground" htmlFor={`present-${bookingId}`}>
        Aanwezig:
      </label>
      <select
        id={`present-${bookingId}`}
        name="present_count"
        defaultValue={presentCount ?? participantCount}
        className="rounded-none border border-input bg-background px-2 py-1 text-xs"
      >
        {options.map((count) => (
          <option key={count} value={count}>
            {count} van {participantCount}
          </option>
        ))}
      </select>
      <SubmitButton />
      {presentCount != null ? (
        <span className="text-xs text-muted-foreground">
          ({formatAttendanceSummary(presentCount, participantCount)})
        </span>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending} className="rounded-none">
      {pending ? "Opslaan…" : "Opslaan"}
    </Button>
  );
}
