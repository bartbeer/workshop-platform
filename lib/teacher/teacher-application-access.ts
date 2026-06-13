import type { ProfileRole, TeacherRequestStatus } from "@/lib/auth/profile-role";

export function canSubmitTeacherApplication(input: {
  role: ProfileRole;
  applicationStatus: TeacherRequestStatus;
}): boolean {
  if (input.role !== "participant") return false;
  return input.applicationStatus === "none" || input.applicationStatus === "rejected";
}

export function teacherApplicationStatusLabel(status: TeacherRequestStatus): string {
  switch (status) {
    case "pending":
      return "In behandeling";
    case "approved":
      return "Goedgekeurd";
    case "rejected":
      return "Afgewezen";
    default:
      return "Nog niet ingediend";
  }
}
