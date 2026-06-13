import type { SessionStatus } from "@/lib/workshops/session-public";
import { isSessionBookable } from "@/lib/workshops/session-public";

export type SessionBookingBlockReason = "missing_session" | "cancelled";

export function sessionBookingBlockReason(session: {
  status: SessionStatus;
} | null): SessionBookingBlockReason | null {
  if (!session) return "missing_session";
  if (!isSessionBookable(session.status)) return "cancelled";
  return null;
}

export function capacityBookingErrorParam(
  reason: SessionBookingBlockReason | "full" | "invalid",
): string {
  if (reason === "full") return "full";
  if (reason === "missing_session") return "missing_session";
  if (reason === "cancelled") return "session_cancelled";
  return "invalid";
}
