"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPasswordResetError } from "@/lib/auth/format-password-reset-error";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().min(1, "Vul je e-mailadres in").email("Ongeldig e-mailadres"),
});

type Values = z.infer<typeof schema>;

function getPasswordResetRedirectUrl(): string {
  const base =
    (typeof window !== "undefined" && window.location.origin) ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "";
  if (!base) {
    return "";
  }
  const next = encodeURIComponent("/set-password");
  return `${base}/auth/callback?next=${next}`;
}

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    const redirectTo = getPasswordResetRedirectUrl();
    if (!redirectTo) {
      setFormError(
        "Kan geen terug-URL bepalen. Zet NEXT_PUBLIC_SITE_URL (bv. https://jouwdomein.nl) in .env.local.",
      );
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    });

    if (error) {
      setFormError(formatPasswordResetError(error.message));
      return;
    }

    setSent(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wachtwoord vergeten</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vul het e-mailadres van je account in. Je ontvangt een link om een nieuw wachtwoord te
          kiezen (controleer ook spam).
        </p>
      </div>

      {sent ? (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Als dit adres bij ons bekend is, is er zojuist een e-mail verstuurd. Open de link in die
          mail en stel daarna je wachtwoord in op deze site.
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">E-mail</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {formError && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Bezig…" : "Stuur resetlink"}
          </Button>
        </form>
      )}

      <Button variant="outline" asChild>
        <Link href="/login">Naar inloggen</Link>
      </Button>
    </div>
  );
}
