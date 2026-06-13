import { redirect } from "next/navigation";

import {
  type ProfileRole,
  resolveProfileRole,
  type TeacherRequestStatus,
} from "@/lib/auth/profile-role";
import { createClient } from "@/lib/supabase/server";

export type { ProfileRole, TeacherRequestStatus };

type AppProfile = {
  role: string;
};

/**
 * Server-only: stuurt naar login als er geen geverifieerde gebruiker is.
 */
export async function requireUser(loginRedirectTo = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(loginRedirectTo)}`);
  }

  return user;
}

export async function getTeacherRequestStatus(userId: string): Promise<TeacherRequestStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_applications")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: Exclude<TeacherRequestStatus, "none"> }>();

  if (error || !data?.status) return "none";
  return data.status;
}

export async function getProfileRole(userId: string): Promise<ProfileRole> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<AppProfile>();

  const teacherApplicationStatus = await getTeacherRequestStatus(userId);

  if (error) {
    return resolveProfileRole({ storedRole: null, teacherApplicationStatus });
  }

  return resolveProfileRole({
    storedRole: data?.role,
    teacherApplicationStatus,
  });
}

export async function requireOwner(loginRedirectTo = "/admin") {
  const user = await requireUser(loginRedirectTo);
  const role = await getProfileRole(user.id);
  const ownerEmail = process.env.PLATFORM_OWNER_EMAIL?.toLowerCase();
  const emailIsOwner = ownerEmail && user.email?.toLowerCase() === ownerEmail;

  if (role !== "owner" && !emailIsOwner) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireApprovedTeacher(loginRedirectTo = "/dashboard/workshops") {
  const user = await requireUser(loginRedirectTo);
  const role = await getProfileRole(user.id);

  if (role !== "teacher" && role !== "owner") {
    redirect("/dashboard?teacher=required");
  }

  return user;
}
