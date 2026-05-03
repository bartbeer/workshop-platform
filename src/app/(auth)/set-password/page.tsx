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
import { createClient } from "@/lib/supabase/client";

const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Minimaal 8 tekens"),
    confirm: z.string().min(1, "Herhaal je wachtwoord"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Wachtwoorden komen niet overeen",
    path: ["confirm"],
  });

type SetPasswordValues = z.infer<typeof setPasswordSchema>;

export default function SetPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: SetPasswordValues) {
    setFormError(null);
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setFormError("Je sessie is verlopen. Vraag een nieuwe resetlink aan of open de mail opnieuw.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(error.message);
      return;
    }

    setDone(true);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-6 py-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wachtwoord instellen</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Stel een wachtwoord in (na uitnodiging of wachtwoord-reset) om voortaan direct te kunnen
          inloggen.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="set-password">Nieuw wachtwoord</Label>
          <Input
            id="set-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="set-password-confirm">Herhaal wachtwoord</Label>
          <Input
            id="set-password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.confirm}
            {...form.register("confirm")}
          />
          {form.formState.errors.confirm && (
            <p className="text-sm text-destructive">{form.formState.errors.confirm.message}</p>
          )}
        </div>

        {formError && (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        {done && (
          <p className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            Wachtwoord opgeslagen. Je wordt doorgestuurd naar je dashboard.
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Opslaan…" : "Wachtwoord opslaan"}
        </Button>
      </form>

      <Button variant="ghost" className="w-full" asChild>
        <Link href="/login">Terug naar inloggen</Link>
      </Button>
    </div>
  );
}
