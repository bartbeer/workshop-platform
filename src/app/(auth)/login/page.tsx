import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { MarketingBackdrop } from "@/components/marketing/marketing-backdrop";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SIDE_IMAGE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCpk080_1BiYHu4KrQidrZ_FrqWoFuptGXsydYx9jIEvIg3QBAQdvoDaMjquwV9mVVLnnSU52J8TTzk3kziodQilng9_WOEPlNzmA2EHySx1AAk-T-kXlE0pPzBIp_HRcGmmRe8GFFlJffpJTJ_k-Ezd-tqcLrTPSwV6hn_YwfXGrUA4O0TNdjDsk0AmM-JHLfYl4NhYYAcXug4ZPvlXH9KPO_Zv8e-xfu0IH741Mw_yQUQR2HinjXBjJ4HKi8VI3GRaBZI4c8kXQN0";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[]; reason?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.redirectTo;
  const redirectTo = getSafeRedirectPath(
    typeof raw === "string" ? raw : undefined,
    "/dashboard",
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <div className="font-body selection:bg-secondary-container/30 relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-japandi-white text-on-surface">
      <MarketingBackdrop />
      <SiteHeader />

      <main className="relative z-10 flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-64 -left-32 h-[500px] w-[500px] rounded-full bg-secondary-container opacity-[0.08] blur-[100px]" />
          <div className="absolute top-3/4 -right-24 h-[400px] w-[400px] rounded-full bg-primary-fixed-dim opacity-[0.08] blur-[100px]" />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-8 pt-28 pb-12 lg:pb-24 lg:pt-32">
          <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 items-start gap-16 lg:grid-cols-12">
            <div className="flex flex-col space-y-10 pt-4 lg:col-span-5 lg:pt-8">
              <div className="space-y-6">
                <h1 className="font-headline text-japandi-charcoal text-5xl leading-[1.05] font-light italic tracking-tight md:text-6xl lg:text-7xl xl:text-8xl">
                  Makerslabo
                </h1>
                <p className="font-headline text-on-surface-variant text-xl font-light italic tracking-wide md:text-2xl">
                  waar verbeelding vorm krijgt
                </p>
              </div>
              <div className="bg-japandi-charcoal/15 h-0.5 w-16" />
              <div className="space-y-6">
                <h2 className="font-headline text-japandi-charcoal text-3xl font-semibold">
                  Welkom in de Studio
                </h2>
                <p className="font-body text-on-surface-variant max-w-md text-lg leading-loose font-light">
                  Eén login voor iedereen: cursisten, makers en beheerders. Meld je aan en ga naar je
                  persoonlijke overzicht — het platform bepaalt automatisch wat je mag zien op basis van
                  je account.
                </p>
                <p className="font-body text-on-surface-variant/80 max-w-md text-sm leading-relaxed font-light">
                  <Link href="/" className="text-japandi-blue underline-offset-4 hover:underline">
                    ← Terug naar de homepage
                  </Link>
                </p>
              </div>
            </div>

            <div className="relative lg:col-span-7">
              <div className="border-outline-variant/10 bg-white/90 shadow-[0_1px_0_rgba(31,27,20,0.04)] relative flex min-h-[480px] flex-col border p-10 backdrop-blur-sm md:p-12 lg:min-h-[520px]">
                <span
                  className="material-symbols-outlined text-japandi-blue mb-5 text-4xl"
                  aria-hidden
                >
                  login
                </span>
                <h3 className="font-headline text-japandi-charcoal mb-3 text-3xl">Inloggen</h3>
                <p className="font-body text-on-surface-variant mb-10 max-w-lg text-base leading-relaxed font-light">
                  Vul je gegevens in. Na het inloggen brengen we je naar het juiste dashboard.
                </p>

                {sp.reason === "invite_only" ? (
                  <p className="font-body border-outline-variant/40 bg-surface-container-low/90 text-on-surface mb-8 border px-4 py-3 text-sm leading-relaxed">
                    Open registratie is uitgeschakeld. Je krijgt toegang via de uitnodigingslink in je mail
                    (bijvoorbeeld na inschrijving voor een workshop).
                  </p>
                ) : null}

                <div className="mt-auto">
                  <LoginForm redirectTo={redirectTo} appearance="studio" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none fixed top-0 right-0 z-[5] hidden h-screen w-[40%] opacity-[0.035] xl:block">
          <Image
            alt=""
            src={SIDE_IMAGE_SRC}
            fill
            className="object-cover grayscale"
            sizes="40vw"
            priority={false}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
