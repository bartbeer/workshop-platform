import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-body selection:bg-secondary-container/30 relative flex min-h-full flex-col overflow-x-hidden bg-japandi-white text-on-surface">
      <MarketingBackdrop />
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
