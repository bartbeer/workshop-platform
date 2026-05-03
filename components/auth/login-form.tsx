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
};

export function LoginForm({ redirectTo }: Props) {
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

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!form.formState.errors.password}
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {formError && (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Bezig…" : "Inloggen"}
      </Button>

      <p className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Wachtwoord vergeten?
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Geen account? Gebruik de link in je uitnodigingsmail om je wachtwoord te kiezen.
      </p>
    </form>
  );
}
