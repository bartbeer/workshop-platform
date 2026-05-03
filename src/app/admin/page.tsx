import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteOrPromoteTeacher } from "@/lib/auth/invite-teacher";
import { requireOwner } from "@/lib/auth/require-user";

async function inviteTeacherAction(formData: FormData) {
  "use server";

  await requireOwner("/admin");
  const email = String(formData.get("email") ?? "").trim();

  try {
    const outcome = await inviteOrPromoteTeacher(email);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    redirect(`/admin?ok=${outcome}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    redirect(`/admin?error=${encodeURIComponent(msg)}`);
  }
}

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireOwner("/admin");
  const query = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Nodig docenten uit per e-mail. Ze ontvangen een link om een wachtwoord te kiezen (nieuwe
          accounts) of krijgen direct teacher-toegang als ze al een account hebben.
        </p>
      </div>

      {query.error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(query.error)}
        </p>
      )}

      {query.ok === "invited" && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Uitnodiging verstuurd. De docent kan via de mail inloggen en een wachtwoord instellen.
        </p>
      )}

      {query.ok === "promoted" && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Dit e-mailadres had al een account; de rol is bijgewerkt naar teacher.
        </p>
      )}

      <form action={inviteTeacherAction} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="teacher-email">E-mail docent</Label>
          <Input
            id="teacher-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="docent@voorbeeld.nl"
            required
          />
        </div>
        <Button type="submit">Uitnodigen als teacher</Button>
      </form>
    </div>
  );
}
