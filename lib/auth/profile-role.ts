export type ProfileRole = "participant" | "teacher" | "owner";
export type TeacherRequestStatus = "none" | "pending" | "approved" | "rejected";

export const PARTICIPANT_PROFILE_ROLE = "participant" as const;

export function resolveProfileRole(input: {
  storedRole: string | null | undefined;
  teacherApplicationStatus: TeacherRequestStatus;
}): ProfileRole {
  const { storedRole, teacherApplicationStatus } = input;

  if (storedRole === "owner") return "owner";
  if (storedRole === "teacher") return "teacher";

  if (teacherApplicationStatus === "approved") {
    return "teacher";
  }

  return PARTICIPANT_PROFILE_ROLE;
}
