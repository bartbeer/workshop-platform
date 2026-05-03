import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMarketingWorkshops } from "@/lib/workshops/fetch-public-workshops";
import { createClient } from "@/lib/supabase/server";
import { workshopImageSrc } from "@/lib/workshops/image-url";

const isDev = process.env.NODE_ENV === "development";

type SessionCountRow = {
  workshop_id: string;
};

export const dynamic = "force-dynamic";

function workshopsListNotice(sp: Record<string, string | string[] | undefined>): string | null {
  const err = typeof sp.error === "string" ? sp.error : undefined;
  const warning = typeof sp.warning === "string" ? sp.warning : undefined;
  if (err === "workshop_not_found") {
    return "We konden de workshoppagina niet openen (slug onbekend of cursus verwijderd). Kies hieronder de juiste cursus.";
  }
  if (err === "stripe_config") {
    return "Online betalen is nog niet geconfigureerd (Stripe).";
  }
  if (warning === "fulfillment_pending") {
    return "Betaling ontvangen, maar inschrijving wordt nog verwerkt. Vernieuw over 1 minuut; blijft het uit, neem contact op.";
  }

  const checkout = typeof sp.checkout === "string" ? sp.checkout : undefined;
  if (checkout === "success") {
    return "Betaling geslaagd. Je inschrijving wordt vastgezet; nieuwe accounts ontvangen een uitnodigingsmail om in te loggen.";
  }
  if (checkout === "cancel") {
    return "Je hebt de betaling afgebroken. Er is geen inschrijving geregistreerd.";
  }

  return null;
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkshopsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { workshops, queryError } = await fetchMarketingWorkshops(supabase);
  const workshopIds = workshops.map((w) => w.id);

  const { data: sessionsData } = workshopIds.length
    ? await supabase
        .from("workshop_sessions")
        .select("workshop_id")
        .in("workshop_id", workshopIds)
        .returns<SessionCountRow[]>()
    : { data: [] as SessionCountRow[] };

  const sessions = sessionsData ?? [];
  const sessionCountByWorkshop = new Map<string, number>();
  sessions.forEach((row) => {
    sessionCountByWorkshop.set(
      row.workshop_id,
      (sessionCountByWorkshop.get(row.workshop_id) ?? 0) + 1,
    );
  });

  const listNotice = workshopsListNotice(sp);
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
      {listNotice && (
        <p className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
          {listNotice}
        </p>
      )}
      {isDev && queryError ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
          [dev] Workshops laden mislukt — {queryError.code ?? "?"}: {queryError.message}.
          {queryError.code === "42703"
            ? " SQL Editor: `alter table public.workshops add column if not exists image_path text;`"
            : " Controleer RLS (`workshops_public_read`), NEXT_PUBLIC_SUPABASE_* en het juiste Supabase-project."}
        </p>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workshops</h1>
        <p className="mt-2 text-muted-foreground">
          Kies een cursus en open de detailpagina om alle datums, prijzen en praktische info te zien.
        </p>
      </div>

      <div className="grid gap-3">
        {workshops.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen workshops beschikbaar.</p>
        ) : (
          workshops.map((workshop) => {
            const n = sessionCountByWorkshop.get(workshop.id) ?? 0;
            const hint =
              n === 0
                ? "Nog geen datums gepland."
                : n === 1
                  ? "Eén geplande datum — open voor prijs, uur en inschrijving."
                  : `${n} verschillende datums — open voor alle opties, prijzen en info per sessie.`;

            return (
              <Card key={workshop.id} size="sm">
                <CardHeader className="flex flex-row items-start gap-4">
                  <Image
                    src={workshopImageSrc(workshop.image_path)}
                    alt={`Afbeelding voor workshop ${workshop.title}`}
                    width={512}
                    height={512}
                    className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
                  />
                  <CardTitle>{workshop.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-xl text-sm text-muted-foreground">{hint}</p>
                  <Button size="sm" asChild>
                    <Link href={`/workshops/${workshop.slug}`}>Bekijk</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Button variant="outline" asChild>
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}