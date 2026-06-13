import { DashboardSubNav } from "@/components/dashboard/dashboard-sub-nav";
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getProfileRole, requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/dashboard");
  const role = await getProfileRole(user.id);

  return (
    <div className="font-body selection:bg-secondary-container/30 relative flex min-h-full flex-col overflow-x-hidden bg-japandi-white text-on-surface">
      <MarketingBackdrop />
      <SiteHeader />
      <main className="relative flex flex-1 flex-col pt-28">
        <DashboardSubNav role={role} />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
