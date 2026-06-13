"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getProfileRole, requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { canMarkBookingAttendance } from "@/lib/workshops/booking-attendance-access";
import {
  isSessionOpenForAttendanceMarking,
  validatePresentCount,
} from "@/lib/workshops/booking-attendance";

export async function markBookingAttendance(formData: FormData) {
  const user = await requireUser("/dashboard/sessions");
  const role = await getProfileRole(user.id);

  const bookingId = String(formData.get("booking_id") ?? "");
  const presentCountRaw = String(formData.get("present_count") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/dashboard/sessions");

  if (!bookingId) redirect(`${redirectTo}?error=missing_booking`);

  const presentCount = Number.parseInt(presentCountRaw, 10);
  if (Number.isNaN(presentCount)) redirect(`${redirectTo}?error=invalid_count`);

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("workshop_bookings")
    .select(
      "id, participant_count, status, workshop_session_id, workshop_sessions(teacher_user_id, starts_at, status)",
    )
    .eq("id", bookingId)
    .maybeSingle<{
      id: string;
      participant_count: number;
      status: string;
      workshop_session_id: string;
      workshop_sessions: {
        teacher_user_id: string | null;
        starts_at: string;
        status: string;
      } | null;
    }>();

  if (!booking || booking.status !== "confirmed") {
    redirect(`${redirectTo}?error=missing_booking`);
  }

  const session = booking.workshop_sessions;
  if (!session || session.status === "cancelled") {
    redirect(`${redirectTo}?error=session_unavailable`);
  }

  if (
    !canMarkBookingAttendance({
      actorUserId: user.id,
      actorRole: role,
      sessionTeacherUserId: session.teacher_user_id,
    })
  ) {
    redirect(`${redirectTo}?error=not_assigned`);
  }

  if (
    role !== "owner" &&
    !isSessionOpenForAttendanceMarking(session.starts_at, new Date())
  ) {
    redirect(`${redirectTo}?error=session_not_started`);
  }

  const validation = validatePresentCount(presentCount, booking.participant_count);
  if (!validation.ok) redirect(`${redirectTo}?error=${validation.reason}`);

  const { error } = await supabase.from("booking_attendance").upsert(
    {
      booking_id: bookingId,
      present_count: presentCount,
      marked_at: new Date().toISOString(),
      marked_by_user_id: user.id,
    },
    { onConflict: "booking_id" },
  );

  if (error) redirect(`${redirectTo}?error=save_failed`);

  revalidatePath("/dashboard/sessions");
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?ok=attendance_saved`);
}
