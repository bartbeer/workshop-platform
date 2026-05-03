import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}) {
  const sp = await searchParams;
  const redirectTo = getSafeRedirectPath(
    typeof sp.redirectTo === "string" ? sp.redirectTo : undefined,
    "/dashboard",
  );
  redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}&reason=invite_only`);
}
