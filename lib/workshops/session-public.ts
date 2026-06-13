export type SessionStatus = "scheduled" | "cancelled";

export function isSessionBookable(status: SessionStatus): boolean {
  return status === "scheduled";
}

export function partitionSessionsByStatus<T extends { status: SessionStatus }>(
  sessions: T[],
): { bookable: T[]; cancelled: T[] } {
  const bookable: T[] = [];
  const cancelled: T[] = [];

  for (const session of sessions) {
    if (isSessionBookable(session.status)) {
      bookable.push(session);
    } else {
      cancelled.push(session);
    }
  }

  return { bookable, cancelled };
}

export function formatTeacherLabel(input: {
  fullName: string | null | undefined;
  email: string | null | undefined;
}): string | null {
  const name = input.fullName?.trim();
  if (name) return name;

  const email = input.email?.trim();
  if (!email) return null;

  const local = email.split("@")[0]?.trim();
  return local || null;
}
