import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardWorkshopsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Teacher workshopbeheer</h1>
      <p className="text-muted-foreground">
        Alleen goedgekeurde teachers kunnen hier workshops beheren.
      </p>
      <Button asChild>
        <Link href="/dashboard/workshops/new">Nieuwe workshop</Link>
      </Button>
    </div>
  );
}
