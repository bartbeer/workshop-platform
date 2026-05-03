import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[]; reason?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.redirectTo;
  const redirectTo = getSafeRedirectPath(
    typeof raw === "string" ? raw : undefined,
    "/dashboard",
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-6 py-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inloggen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in met je e-mailadres en wachtwoord.
        </p>
        {sp.reason === "invite_only" && (
          <p className="mt-3 rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
            Open registratie is uitgeschakeld. Je krijgt toegang via de uitnodigingslink in je mail
            (bijvoorbeeld na inschrijving voor een workshop).
          </p>
        )}
      </div>
      <LoginForm redirectTo={redirectTo} />
      <Button variant="ghost" className="w-full" asChild>
        <Link href="/">Terug naar home</Link>
      </Button>
    </div>
  );
}
