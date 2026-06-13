import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WorkshopCreateForm } from "@/components/workshops/workshop-create-form";
import { requireOwner } from "@/lib/auth/require-user";
import { fetchApprovedTeacherOptions } from "@/lib/workshops/fetch-approved-teachers";

export const dynamic = "force-dynamic";

export default async function AdminNewWorkshopPage() {
  await requireOwner("/admin/workshops/new");
  const teacherOptions = await fetchApprovedTeacherOptions();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Nieuwe workshop</h1>
        <p className="text-muted-foreground">
          Maak een catalogus-workshop aan en wijs per sessie een docent toe.
        </p>
      </header>

      {teacherOptions.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
          Nog geen docenten beschikbaar. Nodig eerst docenten uit via{" "}
          <Link href="/admin" className="underline">
            Platformbeheer
          </Link>
          .
        </p>
      ) : (
        <WorkshopCreateForm teacherOptions={teacherOptions} />
      )}

      <div className="mt-10">
        <Button variant="outline" asChild>
          <Link href="/admin/workshops">Terug naar overzicht</Link>
        </Button>
      </div>
    </div>
  );
}
