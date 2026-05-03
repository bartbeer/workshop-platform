"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type FutureBookingRow = {
  id: string;
  workshop_sessions: { starts_at: string } | null;
};

/**
 * Verwijdert account + gekoppelde data alleen als er geen toekomstige deelnemers-boekingen zijn
 * én geen toekomstige sessies als teacher.
 */
export async function deleteOwnAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=%2Fdashboard");
  }

  const nowIso = new Date().toISOString();
  const { data: futureBookings } = await supabase
    .from("workshop_bookings")
    .select("id,workshop_sessions!inner(starts_at)")
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .gt("workshop_sessions.starts_at", nowIso)
    .limit(1)
    .returns<FutureBookingRow[]>();

  if ((futureBookings ?? []).length > 0) {
    redirect("/dashboard?account=blocked_future");
  }

  const { data: myWorkshops } = await supabase
    .from("workshops")
    .select("id")
    .eq("teacher_user_id", user.id)
    .returns<{ id: string }[]>();

  const workshopIds = (myWorkshops ?? []).map((w) => w.id);
  if (workshopIds.length > 0) {
    const { data: futureSessions } = await supabase
      .from("workshop_sessions")
      .select("id")
      .in("workshop_id", workshopIds)
      .gt("starts_at", nowIso)
      .limit(1)
      .returns<{ id: string }[]>();

    if ((futureSessions ?? []).length > 0) {
      redirect("/dashboard?account=blocked_teaching");
    }
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    redirect("/dashboard?account=delete_config");
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect("/dashboard?account=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
