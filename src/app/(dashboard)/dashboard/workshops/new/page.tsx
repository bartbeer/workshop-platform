import Link from "next/link";

import { WorkshopCreateForm } from "@/components/workshops/workshop-create-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NewWorkshopPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nieuwe workshop</h1>
        <p className="mt-2 text-muted-foreground">
          Vul de cursus in en voeg zelf de datums en tijden toe waarop je lesgeeft. Je kunt
          willekeurige combinaties kiezen (bijv. alleen zaterdagen, of verspreid over maanden).
        </p>
      </div>

      <WorkshopCreateForm />

      <Button variant="outline" asChild>
        <Link href="/dashboard/workshops">Terug</Link>
      </Button>
    </div>
  );
}
