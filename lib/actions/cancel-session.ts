"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/auth/require-user";
import { sendSessionCancellationEmail } from "@/lib/email/resend-session-cancellation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { bookingStatusesToCancelOnSessionCancel } from "@/lib/workshops/session-cancellation";
import { fetchWorkshopEmailContext } from "@/lib/workshops/workshop-email-context";

export async function cancelSessionByOwner(formData: FormData) {
  await requireOwner("/admin/workshops");

  const sessionId = String(formData.get("session_id") ?? "");
  const workshopId = String(formData.get("workshop_id") ?? "");
  if (!sessionId || !workshopId) {
    redirect("/admin/workshops?error=missing_session");
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workshop_sessions")
    .select("id, status, workshop_id")
    .eq("id", sessionId)
    .eq("workshop_id", workshopId)
    .maybeSingle<{ id: string; status: string; workshop_id: string }>();

  if (!session) redirect(`/admin/workshops/${workshopId}/edit?error=missing_session`);
  if (session.status === "cancelled") {
    redirect(`/admin/workshops/${workshopId}/edit?error=already_cancelled`);
  }

  const admin = createAdminClient();

  const { error: sessionErr } = await admin
    .from("workshop_sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId);

  if (sessionErr) redirect(`/admin/workshops/${workshopId}/edit?error=cancel_failed`);

  const statuses = bookingStatusesToCancelOnSessionCancel();
  const { data: bookings } = await admin
    .from("workshop_bookings")
    .select("id, user_id, participant_count, status")
    .eq("workshop_session_id", sessionId)
    .in("status", statuses);

  if (bookings?.length) {
    await admin
      .from("workshop_bookings")
      .update({ status: "cancelled" })
      .eq("workshop_session_id", sessionId)
      .in("status", statuses);

    const emailCtx = await fetchWorkshopEmailContext(admin, sessionId);
    if (emailCtx) {
      for (const booking of bookings) {
        const { data: userData } = await admin.auth.admin.getUserById(booking.user_id);
        const email = userData.user?.email;
        if (!email) continue;
        await sendSessionCancellationEmail({
          to: email,
          ctx: emailCtx,
          participantCount: booking.participant_count,
        });
      }
    }
  }

  revalidatePath("/workshops");
  revalidatePath(`/admin/workshops/${workshopId}/edit`);
  redirect(`/admin/workshops/${workshopId}/edit?ok=session_cancelled`);
}
