"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/client";

type VerifyType = "invite" | "recovery";

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return null;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const rawNext = new URLSearchParams(window.location.search).get("next");
    const nextPath = getSafeRedirectPath(rawNext, "/set-password");

    const timeout = window.setTimeout(async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = firstNonEmpty(url.searchParams.get("code"), hash.get("code"));
      const tokenHash = firstNonEmpty(url.searchParams.get("token_hash"), hash.get("token_hash"));
      const typeRaw = firstNonEmpty(url.searchParams.get("type"), hash.get("type"));
      const type = typeRaw === "invite" || typeRaw === "recovery" ? (typeRaw as VerifyType) : null;

      // Belangrijk: voorkom sessie-mixup (bv. owner al ingelogd en daarna invite-link openen).
      if (nextPath === "/set-password") {
        await supabase.auth.signOut({ scope: "local" });
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      } else if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (verifyError) {
          setError(verifyError.message);
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (data.session) {
        router.replace(nextPath);
      } else {
        setError("Deze link is ongeldig of verlopen. Vraag een nieuwe e-mail aan.");
      }
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Bevestigen…</h1>
      {!error ? (
        <p className="text-sm text-muted-foreground">We verifiëren je link en loggen je in.</p>
      ) : (
        <>
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
          <Button variant="outline" asChild>
            <Link href="/login">Naar inloggen</Link>
          </Button>
        </>
      )}
    </div>
  );
}
