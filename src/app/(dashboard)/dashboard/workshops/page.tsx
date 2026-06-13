import { redirect } from "next/navigation";

import { getProfileRole, requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function DashboardWorkshopsPage() {
  const user = await requireUser("/dashboard/workshops");
  const role = await getProfileRole(user.id);

  if (role === "owner") {
    redirect("/admin/workshops");
  }

  if (role === "teacher") {
    redirect("/dashboard/sessions");
  }

  redirect("/dashboard");
}
