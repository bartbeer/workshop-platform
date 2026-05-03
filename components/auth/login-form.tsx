"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().min(1, "Vul je e-mailadres in").email("Ongeldig e-mailadres"),
  password: z.string().min(1, "Vul je wachtwoord in"),
});

type LoginValues = z.infer<typeof loginSchema>;

type Props = {
  redirectTo: string;
  appearance?: "default" | "studio";
};

const studioLabel =
  "font-label w-full flex-col items-start gap-0 text-[11px] font-bold tracking-[0.25em] text-on-marketing-background uppercase";
const studioInput =
  "rounded-none border-none bg-surface-container/80 py-4 px-4 text-sm shadow-none placeholder:text-on-surface-variant/40 focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-japandi-blue aria-invalid:ring-error aria-invalid:ring-1";

export function LoginForm({ redirectTo, appearance = "default" }: Props) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    const next = getSafeRedirectPath(redirectTo, "/dashboard");
    router.push(next);
    router.refresh();
  }

  const studio = appearance === "studio";

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={studio ? "flex flex-col gap-6" : "flex flex-col gap-5"}
    >
      <div className={studio ? "space-y-4" : "space-y-2"}>
        <Label htmlFor="email" className={studio ? studioLabel : undefined}>
          E-mailadres
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!form.formState.errors.email}
          className={studio ? studioInput : undefined}
          placeholder={studio ? "naam@voorbeeld.be" : undefined}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className={`text-sm text-destructive ${studio ? "font-body" : ""}`}>
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className={studio ? "space-y-4" : "space-y-2"}>
        <Label htmlFor="password" className={studio ? studioLabel : undefined}>
          Wachtwoord
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!form.formState.errors.password}
          className={studio ? studioInput : undefined}
          placeholder={studio ? "••••••••" : undefined}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className={`text-sm text-destructive ${studio ? "font-body" : ""}`}>
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {formError && (
        <p
          className={
            studio
              ? "font-body border-error/30 bg-error-container/40 text-error rounded-none border px-4 py-3 text-sm"
              : "rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          }
        >
          {formError}
        </p>
      )}

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className={
          studio
            ? "font-label h-auto w-full rounded-none bg-japandi-blue py-5 text-xs font-bold tracking-widest text-white uppercase hover:bg-japandi-blue/90 hover:opacity-90"
            : undefined
        }
      >
        {form.formState.isSubmitting ? (
          "Bezig…"
        ) : studio ? (
          <span className="flex items-center justify-center gap-3">
            Verder naar het platform
            <span aria-hidden className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </span>
        ) : (
          "Inloggen"
        )}
      </Button>

      <p className={`text-center ${studio ? "" : "text-sm"}`}>
        <Link
          href="/forgot-password"
          className={
            studio
              ? "font-label text-on-surface-variant hover:text-japandi-blue text-[10px] tracking-widest uppercase transition-colors"
              : "font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
          }
        >
          Wachtwoord vergeten?
        </Link>
      </p>

      <p
        className={
          studio
            ? "font-body text-center text-xs leading-relaxed font-light text-on-surface-variant"
            : "text-center text-sm text-muted-foreground"
        }
      >
        Geen account? Gebruik de link in je uitnodigingsmail om je wachtwoord te kiezen.
      </p>
    </form>
  );
}
