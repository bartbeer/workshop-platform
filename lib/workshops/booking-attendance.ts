export type PresentCountValidation =
  | { ok: true }
  | { ok: false; reason: "invalid_count" | "too_many_present" };

export function validatePresentCount(
  presentCount: number,
  participantCount: number,
): PresentCountValidation {
  if (!Number.isInteger(presentCount) || presentCount < 0) {
    return { ok: false, reason: "invalid_count" };
  }
  if (presentCount > participantCount) {
    return { ok: false, reason: "too_many_present" };
  }
  return { ok: true };
}

export function formatAttendanceSummary(
  presentCount: number | null | undefined,
  participantCount: number,
): string {
  if (presentCount == null) return "Nog niet gemarkeerd";
  return `${presentCount} van ${participantCount} aanwezig`;
}

export function isSessionOpenForAttendanceMarking(sessionStartsAt: string, now: Date): boolean {
  return new Date(sessionStartsAt).getTime() <= now.getTime();
}
