import type { ProfileRole } from "@/lib/auth/profile-role";

export function canMarkBookingAttendance(params: {
  actorUserId: string;
  actorRole: ProfileRole;
  sessionTeacherUserId: string | null;
}): boolean {
  if (params.actorRole === "owner") return true;
  if (params.actorRole !== "teacher") return false;
  if (!params.sessionTeacherUserId) return false;
  return params.sessionTeacherUserId === params.actorUserId;
}
