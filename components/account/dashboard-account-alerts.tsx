"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Toont server-action redirects (?account=…) onder de dashboard-header.
 * Client-only vanwege useSearchParams (Suspense-boundary in layout).
 */
export function DashboardAccountAlerts() {
  const sp = useSearchParams();
  const account = sp.get("account");

  if (!account) {
    return null;
  }

  if (account === "blocked_teaching") {
    return (
      <p className="font-body border-outline-variant/40 bg-japandi-cream/80 text-on-surface rounded-none border px-3 py-2 text-sm">
        Je account kan niet verwijderd worden zolang je nog toekomstige sessies geeft als teacher.
        Annuleer of verplaats die sessies eerst, of neem contact op met de organisatie.{" "}
        <Link href="/dashboard/workshops" className="font-medium underline">
          Beheer je workshops
        </Link>
      </p>
    );
  }

  if (account === "blocked_future") {
    return (
      <p className="font-body border-outline-variant/40 bg-japandi-cream/80 text-on-surface rounded-none border px-3 py-2 text-sm">
        Je account kan niet verwijderd worden zolang je nog toekomstige workshopinschrijvingen hebt.
      </p>
    );
  }

  if (account === "delete_failed") {
    return (
      <p className="font-body border-outline-variant/40 bg-japandi-cream/80 text-on-surface rounded-none border px-3 py-2 text-sm">
        Verwijderen is mislukt. Probeer opnieuw of neem contact op.
      </p>
    );
  }

  if (account === "delete_config") {
    return (
      <p className="font-body border-outline-variant/40 bg-japandi-cream/80 text-on-surface rounded-none border px-3 py-2 text-sm">
        Verwijderen is tijdelijk niet beschikbaar door serverconfiguratie.
      </p>
    );
  }

  return null;
}
