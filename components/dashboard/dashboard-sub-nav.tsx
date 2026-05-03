"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { DashboardAccountAlerts } from "@/components/account/dashboard-account-alerts";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";

function dashboardNavLinkClass(active: boolean) {
  return active
    ? "font-label border-marketing-primary text-marketing-primary inline-block border-b-2 py-2 text-[10px] font-bold tracking-widest uppercase"
    : "font-label text-on-surface-variant inline-block py-2 text-[10px] tracking-widest uppercase transition-colors hover:text-japandi-blue";
}

function navLinkActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/workshops/new") {
    return pathname === "/dashboard/workshops/new" || pathname.startsWith("/dashboard/workshops/new/");
  }
  if (href === "/dashboard/workshops") {
    return (
      pathname === "/dashboard/workshops" ||
      (pathname.startsWith("/dashboard/workshops/") &&
        !pathname.startsWith("/dashboard/workshops/new"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSubNav({ canTeach }: { canTeach: boolean }) {
  const pathname = usePathname();

  return (
    <div className="border-outline-variant/10 bg-white/90 backdrop-blur-md border-b">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/dashboard" className={dashboardNavLinkClass(navLinkActive("/dashboard", pathname))}>
              Overzicht
            </Link>
            {canTeach ? (
              <>
                <Link
                  href="/dashboard/workshops"
                  className={dashboardNavLinkClass(navLinkActive("/dashboard/workshops", pathname))}
                >
                  Mijn workshops
                </Link>
                <Link
                  href="/dashboard/workshops/new"
                  className={dashboardNavLinkClass(navLinkActive("/dashboard/workshops/new", pathname))}
                >
                  Nieuwe workshop
                </Link>
              </>
            ) : null}
          </nav>
          <DeleteAccountDialog />
        </div>
        <Suspense fallback={null}>
          <DashboardAccountAlerts />
        </Suspense>
      </div>
    </div>
  );
}
