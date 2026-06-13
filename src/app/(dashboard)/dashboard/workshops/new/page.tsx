import { redirect } from "next/navigation";

import { getProfileRole, requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewWorkshopPage() {
  const user = await requireUser("/dashboard/workshops/new");
  const role = await getProfileRole(user.id);

  if (role === "owner") {
    redirect("/admin/workshops/new");
  }

  redirect("/dashboard?teacher=required");
}
