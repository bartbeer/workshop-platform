"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { DashboardAccountAlerts } from "@/components/account/dashboard-account-alerts";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import type { ProfileRole } from "@/lib/auth/profile-role";

function dashboardNavLinkClass(active: boolean) {
  return active
    ? "font-label border-marketing-primary text-marketing-primary inline-block border-b-2 py-2 text-[10px] font-bold tracking-widest uppercase"
    : "font-label text-on-surface-variant inline-block py-2 text-[10px] tracking-widest uppercase transition-colors hover:text-japandi-blue";
}

function navLinkActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSubNav({ role }: { role: ProfileRole }) {
  const pathname = usePathname();
  const isTeacher = role === "teacher" || role === "owner";
  const isParticipant = role === "participant";

  return (
    <div className="border-outline-variant/10 bg-white/90 backdrop-blur-md border-b">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/dashboard" className={dashboardNavLinkClass(navLinkActive("/dashboard", pathname))}>
              Overzicht
            </Link>
            {isTeacher ? (
              <Link
                href="/dashboard/sessions"
                className={dashboardNavLinkClass(navLinkActive("/dashboard/sessions", pathname))}
              >
                Mijn sessies
              </Link>
            ) : null}
            {role === "owner" ? (
              <Link
                href="/admin/workshops"
                className={dashboardNavLinkClass(navLinkActive("/admin/workshops", pathname))}
              >
                Catalogus beheer
              </Link>
            ) : null}
            {isParticipant ? (
              <Link
                href="/dashboard/become-teacher"
                className={dashboardNavLinkClass(navLinkActive("/dashboard/become-teacher", pathname))}
              >
                Docent worden
              </Link>
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
