export type SessionTeacherAssignmentInput = {
  teacher_user_id: string;
};

export function validateSessionTeacherAssignments(
  sessions: SessionTeacherAssignmentInput[],
  allowedTeacherIds: Set<string>,
): { ok: true } | { ok: false; reason: "missing_teacher" | "invalid_teacher" } {
  for (const session of sessions) {
    const teacherId = session.teacher_user_id?.trim();
    if (!teacherId) return { ok: false, reason: "missing_teacher" };
    if (!allowedTeacherIds.has(teacherId)) return { ok: false, reason: "invalid_teacher" };
  }
  return { ok: true };
}
