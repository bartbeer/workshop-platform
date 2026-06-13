import Link from "next/link";

import { TeacherApplicationForm } from "@/components/teacher/teacher-application-form";
import { Button } from "@/components/ui/button";
import {
  getProfileRole,
  getTeacherRequestStatus,
  requireUser,
} from "@/lib/auth/require-user";
import {
  canSubmitTeacherApplication,
  teacherApplicationStatusLabel,
} from "@/lib/teacher/teacher-application-access";

export const dynamic = "force-dynamic";

export default async function BecomeTeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const user = await requireUser("/dashboard/become-teacher");
  const role = await getProfileRole(user.id);
  const applicationStatus = await getTeacherRequestStatus(user.id);
  const query = await searchParams;
  const canApply = canSubmitTeacherApplication({ role, applicationStatus });

  return (
    <div className="content-layer mx-auto flex w-full max-w-3xl flex-col gap-8 px-8 py-16 md:py-24">
      <header className="space-y-3">
        <h1 className="font-headline text-3xl font-light">Docent worden</h1>
        <p className="text-on-surface-variant font-body text-lg font-light">
          Dien een aanvraag in om workshops te geven bij Makerslabo. De Owner beoordeelt elke
          aanvraag.
        </p>
      </header>

      {query.ok === "submitted" && (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          Je aanvraag is ontvangen. Je hoort wanneer deze is beoordeeld.
        </p>
      )}

      {role === "teacher" || role === "owner" ? (
        <p className="text-sm text-muted-foreground">
          Je bent al docent op het platform.{" "}
          <Link href="/dashboard/sessions" className="underline">
            Bekijk je sessies
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="text-sm">
            Status: <strong>{teacherApplicationStatusLabel(applicationStatus)}</strong>
          </p>
          {canApply ? (
            <TeacherApplicationForm />
          ) : applicationStatus === "pending" ? (
            <p className="text-sm text-muted-foreground">
              Je aanvraag wordt beoordeeld. Je ontvangt bericht zodra er een beslissing is.
            </p>
          ) : null}
        </>
      )}

      <Button variant="outline" asChild className="w-fit rounded-none">
        <Link href="/dashboard">Terug naar overzicht</Link>
      </Button>
    </div>
  );
}
