import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type WorkshopListRow = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
};

export default async function AdminWorkshopsPage() {
  await requireOwner("/admin/workshops");
  const supabase = await createClient();
  const { data } = await supabase
    .from("workshops")
    .select("id,slug,title,created_at")
    .order("created_at", { ascending: false })
    .returns<WorkshopListRow[]>();

  const workshops = data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workshops</h1>
          <p className="mt-2 text-muted-foreground">
            Beheer de catalogus. Alleen de Owner kan workshops en sessies aanmaken of wijzigen.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/workshops/new">Nieuwe workshop</Link>
        </Button>
      </div>

      {workshops.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen workshops in de catalogus.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {workshops.map((workshop) => (
            <li key={workshop.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{workshop.title}</p>
                <p className="text-sm text-muted-foreground">/{workshop.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workshops/${workshop.slug}`}>Bekijk</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/admin/workshops/${workshop.id}/edit`}>Bewerken</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
