import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteOrPromoteTeacher } from "@/lib/auth/invite-teacher";
import { requireOwner } from "@/lib/auth/require-user";
import { reviewTeacherApplication } from "@/lib/actions/teacher-application";
import { createClient } from "@/lib/supabase/server";

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

type PendingApplication = {
  id: string;
  workshop_type: string;
  experience: string;
  motivation: string;
  created_at: string;
  user_id: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireOwner("/admin");
  const query = await searchParams;
  const supabase = await createClient();

  const { data: pendingApps } = await supabase
    .from("teacher_applications")
    .select("id,workshop_type,experience,motivation,created_at,user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<PendingApplication[]>();

  const pending = pendingApps ?? [];
  const applicantIds = pending.map((a) => a.user_id);
  type ApplicantLabelRow = { user_id: string; label: string; email: string };
  const { data: applicantLabelsRaw } = applicantIds.length
    ? await supabase.rpc("booker_labels_by_user_ids", { p_user_ids: applicantIds })
    : { data: [] as ApplicantLabelRow[] };
  const applicantLabels = (applicantLabelsRaw ?? []) as ApplicantLabelRow[];
  const labelByUserId = new Map(applicantLabels.map((row) => [row.user_id, row]));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platformbeheer</h1>
        <p className="mt-2 text-muted-foreground">
          Nodig docenten uit, beoordeel aanvragen en beheer de workshopcatalogus.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/workshops">Naar workshopcatalogus</Link>
        </Button>
      </div>

      {query.error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeURIComponent(query.error)}
        </p>
      )}

      {query.ok === "invited" && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Uitnodiging verstuurd.
        </p>
      )}
      {query.ok === "promoted" && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Account bijgewerkt naar docent.
        </p>
      )}
      {query.ok === "application_approved" && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Aanvraag goedgekeurd.
        </p>
      )}
      {query.ok === "application_rejected" && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Aanvraag afgewezen.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Docent uitnodigen</h2>
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
          <Button type="submit">Uitnodigen als docent</Button>
        </form>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">Openstaande docent-aanvragen</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen openstaande aanvragen.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map((app) => {
              const applicant = labelByUserId.get(app.user_id);
              return (
                <li key={app.id} className="rounded-xl border border-border px-4 py-4">
                  <p className="font-medium">{applicant?.label ?? "Aanvrager"}</p>
                  {applicant?.email ? (
                    <p className="text-sm text-muted-foreground">{applicant.email}</p>
                  ) : null}
                  <p className="mt-2 text-sm">
                    <strong>Workshop:</strong> {app.workshop_type}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{app.motivation}</p>
                  <div className="mt-4 flex gap-2">
                    <form action={reviewTeacherApplication}>
                      <input type="hidden" name="application_id" value={app.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <Button type="submit" size="sm">
                        Goedkeuren
                      </Button>
                    </form>
                    <form action={reviewTeacherApplication}>
                      <input type="hidden" name="application_id" value={app.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" size="sm" variant="outline">
                        Afwijzen
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
