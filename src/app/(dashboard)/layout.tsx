import Link from "next/link";
import { Suspense } from "react";

import { DashboardAccountAlerts } from "@/components/account/dashboard-account-alerts";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { getProfileRole, requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const role = await getProfileRole(user.id);
  const canTeach = role === "teacher" || role === "owner";

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
              <Link href="/dashboard" className="text-foreground">
                Overzicht
              </Link>
              {canTeach && (
                <>
                  <Link
                    href="/dashboard/workshops"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Mijn workshops
                  </Link>
                  <Link
                    href="/dashboard/workshops/new"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Nieuwe workshop
                  </Link>
                </>
              )}
            </nav>
            <DeleteAccountDialog />
          </div>
          <Suspense fallback={null}>
            <DashboardAccountAlerts />
          </Suspense>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
