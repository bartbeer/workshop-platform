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
  const canTeach = role === "teacher" || role === "owner";

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Overzicht</h1>
        <p className="text-muted-foreground">
          Welkom {user.email ?? "gebruiker"}.
          {canTeach
            ? " Je hebt toegang tot workshopbeheer."
            : " Je account is standaard een gast-account (deelnemer)."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Rol: {role}</Badge>
      </div>

      {params.teacher === "required" && !canTeach && (
        <p className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm">
          Workshopbeheer is alleen voor docenten. Vraag de platformbeheerder om je uit te nodigen als
          teacher.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mijn inschrijvingen</CardTitle>
          <CardDescription>
            Je actieve en geannuleerde boekingen per cursusdatum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen inschrijvingen gevonden.
            </p>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-border bg-background px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {booking.workshop_sessions?.workshops?.title ?? "Workshop"}
                  </p>
                  <Badge variant="outline">{booking.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.workshop_sessions?.starts_at
                    ? new Date(booking.workshop_sessions.starts_at).toLocaleString("nl-NL")
                    : "Datum volgt"}
                  {booking.workshop_sessions?.location
                    ? ` - ${booking.workshop_sessions.location}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aantal deelnemers: {booking.participant_count}
                </p>
                {booking.workshop_sessions?.workshops?.slug && (
                  <Link
                    href={`/workshops/${booking.workshop_sessions.workshops.slug}`}
                    className="mt-2 inline-block text-sm underline"
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
        <Button asChild>
          <Link href="/workshops">Workshops ontdekken</Link>
        </Button>
        {canTeach && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/workshops/new">Nieuwe workshop</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}