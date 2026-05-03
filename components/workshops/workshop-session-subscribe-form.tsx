"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelSessionBooking, subscribeToSession } from "@/lib/actions/workshop-booking";

type Props = {
  slug: string;
  sessionId: string;
  /** Prijs per deelnemer in centen; null = nog niet bekend */
  pricePerPersonCents: number | null;
  defaultParticipantCount: number;
  disableSubmit: boolean;
  isConfirmed: boolean;
  isLoggedIn: boolean;
};

export function WorkshopSessionSubscribeForm({
  slug,
  sessionId,
  pricePerPersonCents,
  defaultParticipantCount,
  disableSubmit,
  isConfirmed,
  isLoggedIn,
}: Props) {
  const [count, setCount] = useState(defaultParticipantCount);

  const clamp = (n: number) => Math.min(20, Math.max(1, Math.round(n)));

  const totalEur =
    pricePerPersonCents != null
      ? ((pricePerPersonCents * count) / 100).toFixed(2).replace(".", ",")
      : null;
  const perPersonEur =
    pricePerPersonCents != null ? (pricePerPersonCents / 100).toFixed(2).replace(".", ",") : null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <form action={subscribeToSession} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="sessionId" value={sessionId} />
          {!isLoggedIn && (
            <div className="min-w-56 w-full sm:w-auto sm:min-w-64">
              <label className="mb-1 block text-xs text-muted-foreground" htmlFor={`email-${sessionId}`}>
                E-mailadres
              </label>
              <Input
                id={`email-${sessionId}`}
                name="guestEmail"
                type="email"
                autoComplete="email"
                required
                placeholder="naam@voorbeeld.nl"
              />
            </div>
          )}
          <div className="min-w-28">
            <label className="mb-1 block text-xs text-muted-foreground" htmlFor={`pc-${sessionId}`}>
              Aantal personen
            </label>
            <Input
              id={`pc-${sessionId}`}
              name="participantCount"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => {
                const raw = Number(e.target.value);
                if (Number.isNaN(raw)) return;
                setCount(clamp(raw));
              }}
            />
          </div>
          <Button type="submit" disabled={disableSubmit}>
            {isConfirmed ? "Aanpassen" : "Schrijf je in"}
          </Button>
        </form>

        {isConfirmed && (
          <form action={cancelSessionBooking}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="sessionId" value={sessionId} />
            <Button type="submit" variant="outline">
              Annuleer
            </Button>
          </form>
        )}
      </div>

      {totalEur != null && perPersonEur != null && (
        <p className="text-sm text-muted-foreground">
          {count} × € {perPersonEur} per persoon = <span className="font-medium text-foreground">€ {totalEur}</span>{" "}
          totaal
        </p>
      )}
    </div>
  );
}
