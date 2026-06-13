import type { SupabaseClient } from "@supabase/supabase-js";

import { sessionBookingBlockReason, capacityBookingErrorParam } from "@/lib/workshops/session-booking-eligibility";
import type { SessionStatus } from "@/lib/workshops/session-public";

export type SeatCountRpcRow = {
  workshop_session_id: string;
  total_participants: number;
};

type SessionCapRow = { id: string; max_participants: number; status: SessionStatus };

/**
 * Zelfde capaciteitslogica als bij inschrijven: bevestigde deelnemers minus eigen huidige boeking + gewenst aantal.
 */
export async function assertSessionCapacity(
  supabase: SupabaseClient,
  workshopSessionId: string,
  participantCount: number,
  forUserId: string | null,
): Promise<
  { ok: true } | { ok: false; reason: "missing_session" | "cancelled" | "full" | "invalid" }
> {
  if (!workshopSessionId || Number.isNaN(participantCount) || participantCount < 1 || participantCount > 20) {
    return { ok: false, reason: "invalid" };
  }

  const { data: session } = await supabase
    .from("workshop_sessions")
    .select("id,max_participants,status")
    .eq("id", workshopSessionId)
    .maybeSingle<SessionCapRow>();

  const blockReason = sessionBookingBlockReason(session);
  if (blockReason) return { ok: false, reason: blockReason };

  if (!session) return { ok: false, reason: "missing_session" };

  const { data: seatRowsRaw } = await supabase.rpc("confirmed_participants_by_sessions", {
    p_session_ids: [workshopSessionId],
  });
  const seatRows = (seatRowsRaw ?? []) as SeatCountRpcRow[];

  let existingConfirmed = 0;
  if (forUserId) {
    const { data: existingBooking } = await supabase
      .from("workshop_bookings")
      .select("participant_count,status")
      .eq("user_id", forUserId)
      .eq("workshop_session_id", workshopSessionId)
      .maybeSingle<{ participant_count: number; status: "pending" | "confirmed" | "cancelled" }>();

    existingConfirmed =
      existingBooking?.status === "confirmed" ? existingBooking.participant_count : 0;
  }

  const confirmedTotal = Number(seatRows[0]?.total_participants ?? 0);
  const effectiveTotal = confirmedTotal - existingConfirmed + participantCount;

  if (effectiveTotal > session.max_participants) {
    return { ok: false, reason: "full" };
  }

  return { ok: true };
}
