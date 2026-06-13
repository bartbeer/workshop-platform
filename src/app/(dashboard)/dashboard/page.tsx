import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileRole, requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

type BookingRow = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  participant_count: number;
  created_at: string;
  workshop_sessions: {
    starts_at: string;
    location: string | null;
    workshops: {
      title: string;
      slug: string;
    } | null;
  } | null;
};

export const dynamic = "force-dynamic";

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ teacher?: string }>;
}) {
  const user = await requireUser("/dashboard");
  const role = await getProfileRole(user.id);
  const params = await searchParams;
  const isTeacher = role === "teacher" || role === "owner";
  const isOwner = role === "owner";
  const isParticipant = role === "participant";

  const supabase = await createClient();
  const { data: bookingsData } = await supabase
    .from("workshop_bookings")
    .select(
      "id,status,participant_count,created_at,workshop_sessions(starts_at,location,workshops(title,slug))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<BookingRow[]>();

  const bookings = bookingsData ?? [];

  return (
    <div className="content-layer mx-auto flex w-full max-w-3xl flex-col gap-10 px-8 py-16 md:py-24">
      <header className="space-y-5 md:text-left">
        <div className="mb-2 flex items-center justify-center gap-4 md:justify-start">
          <div className="bg-outline/25 hidden h-px w-12 md:block" />
          <span className="font-label text-outline text-xs font-bold tracking-[0.25em] uppercase">
            Jouw account
          </span>
        </div>
        <h1 className="font-headline text-japandi-charcoal text-center text-4xl font-light md:text-left md:text-5xl">
          Overzicht
        </h1>
        <p className="font-body text-on-surface-variant text-center text-lg leading-relaxed font-light md:text-left">
          Welkom {user.email ?? "gebruiker"}.
          {isTeacher
            ? " Je bent docent op het platform."
            : " Je bent ingeschreven als deelnemer."}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="font-label border-outline-variant/40 text-on-surface-variant rounded-none text-[10px] tracking-widest uppercase"
        >
          Rol: {role}
        </Badge>
      </div>

      {params.teacher === "required" && !isTeacher && (
        <p className="font-body border-outline-variant/40 bg-japandi-cream/80 text-on-surface rounded-none border px-3 py-2 text-sm">
          Workshopbeheer is voorbehouden aan de platformbeheerder. Wil je docent worden? Dien een
          aanvraag in of vraag een uitnodiging aan.
        </p>
      )}

      <Card className="border-outline-variant/25 rounded-none bg-white/95 shadow-none ring-0">
        <CardHeader className="rounded-none">
          <CardTitle className="font-headline text-japandi-charcoal text-xl font-light">
            Mijn inschrijvingen
          </CardTitle>
          <CardDescription className="font-body text-on-surface-variant text-base font-light">
            Je actieve en geannuleerde boekingen per cursusdatum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.length === 0 ? (
            <p className="font-body text-on-surface-variant text-sm">
              Nog geen inschrijvingen gevonden.
            </p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="border-outline-variant/30 bg-japandi-cream/50 rounded-none border px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-on-surface font-medium">
                    {booking.workshop_sessions?.workshops?.title ?? "Workshop"}
                  </p>
                  <Badge
                    variant="outline"
                    className="font-label border-outline-variant/40 rounded-none text-[10px] tracking-widest uppercase"
                  >
                    {booking.status}
                  </Badge>
                </div>
                <p className="font-body text-on-surface-variant mt-1 text-sm">
                  {booking.workshop_sessions?.starts_at
                    ? new Date(booking.workshop_sessions.starts_at).toLocaleString("nl-NL")
                    : "Datum volgt"}
                  {booking.workshop_sessions?.location
                    ? ` - ${booking.workshop_sessions.location}`
                    : ""}
                </p>
                <p className="font-body text-on-surface-variant mt-1 text-sm">
                  Aantal deelnemers: {booking.participant_count}
                </p>
                {booking.workshop_sessions?.workshops?.slug && (
                  <Link
                    href={`/workshops/${booking.workshop_sessions.workshops.slug}`}
                    className="font-label text-marketing-primary mt-2 inline-block text-[10px] font-bold tracking-widest uppercase underline-offset-4 hover:underline"
                  >
                    Bekijk workshop
                  </Link>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          className="rounded-none bg-japandi-blue font-label text-[10px] tracking-widest text-white uppercase hover:bg-japandi-blue/90"
        >
          <Link href="/workshops">Workshops ontdekken</Link>
        </Button>
        {isTeacher && (
          <Button
            variant="outline"
            asChild
            className="border-japandi-charcoal/25 rounded-none font-label text-[10px] tracking-widest uppercase"
          >
            <Link href="/dashboard/sessions">Mijn sessies</Link>
          </Button>
        )}
        {isOwner && (
          <Button
            variant="outline"
            asChild
            className="border-japandi-charcoal/25 rounded-none font-label text-[10px] tracking-widest uppercase"
          >
            <Link href="/admin/workshops">Catalogus beheer</Link>
          </Button>
        )}
        {isParticipant && (
          <Button
            variant="outline"
            asChild
            className="border-japandi-charcoal/25 rounded-none font-label text-[10px] tracking-widest uppercase"
          >
            <Link href="/dashboard/become-teacher">Docent worden</Link>
          </Button>
        )}
        <Button
          variant="outline"
          asChild
          className="border-japandi-charcoal/25 rounded-none font-label text-[10px] tracking-widest uppercase"
        >
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}