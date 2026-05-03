import Image from "next/image";

import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { HomeWorkshopsSection } from "@/components/marketing/home-workshops-section";
import { NewsletterSection } from "@/components/marketing/newsletter-section";
import { HERO_SLIDES } from "@/lib/marketing/hero-slides";
import { fetchMarketingWorkshops } from "@/lib/workshops/fetch-public-workshops";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const INTRO_IMAGE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXc8H9LvMGPoRM95hHJnmIy4sTLZo1iKXBZJyW91sMrhFZzxYiT9SXTQ-V2zSeVv7kPIlZxDBgygqeF1rIQaklj-gYDUKUjba_z9jQiogt57C_Txkj42EVRxRjgvlv4Z8-oZiu0lmTIL5FDhXGqxqypjG7SzegL1Ji7lB_KcPkBfzAtKATjsayQP8Ffp17UT6ZZ5LAqPedAf7nGBDqQ8eABt89zrJTqcyp0a8HB6Pnv8h5Tw64R45vhyEyGpgjlhRtxlSZh14Vji_1";

const LOCATION_IMAGE_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCP25PO_drLwUzwBaFSjaTwsOSqZ4lZJQNJD56SsBiIoV18HMp_l6LZITA8kd_Klzqb9X0iFQ0ZG372ybAGRqvIcg52_Hb_INzlqYjM_X4OtzUagZDlfKgynME9WYeHjjTzPeCZETH2On_Co5oQBZgdlT9QXML3MgMvoQVe1DDEzGb-91DGwliyJVXR9-rmAH75IWQ1wcplCK4w_GzwwH8nIoWHiiRE0UXR4BC7vSI2XCRcRG4bcxCrV3Yr0ewo6hGGPEBUzHmOrj78";

type SessionCountRow = {
  workshop_id: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const sp = await searchParams;
  const accountDeleted = sp.account === "deleted";

  const supabase = await createClient();
  const { workshops, queryError } = await fetchMarketingWorkshops(supabase);
  const workshopIds = workshops.map((w) => w.id);

  const { data: sessionsData } = workshopIds.length
    ? await supabase
        .from("workshop_sessions")
        .select("workshop_id")
        .in("workshop_id", workshopIds)
        .returns<SessionCountRow[]>()
    : { data: [] as SessionCountRow[] };

  const sessions = sessionsData ?? [];
  const sessionCountByWorkshop = new Map<string, number>();
  sessions.forEach((row) => {
    sessionCountByWorkshop.set(
      row.workshop_id,
      (sessionCountByWorkshop.get(row.workshop_id) ?? 0) + 1,
    );
  });

  return (
    <>
      {accountDeleted ? (
        <div className="content-layer relative z-[40] px-8 pt-28 pb-4">
          <p className="border-outline-variant/40 bg-white/90 mx-auto max-w-lg rounded-none border px-4 py-3 text-center text-sm text-on-surface backdrop-blur-sm">
            Je account is succesvol verwijderd. Bedankt voor je gebruik van het platform.
          </p>
        </div>
      ) : null}

      {isDev && queryError ? (
        <div className="content-layer relative z-[40] px-8 pt-28 pb-2">
          <p className="mx-auto max-w-3xl rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 font-mono text-xs text-destructive">
            [dev] Workshops laden mislukt — {queryError.code ?? "?"}: {queryError.message}.
            {queryError.code === "42703"
              ? " Voer op Supabase → SQL: `alter table public.workshops add column if not exists image_path text;` (zie supabase/migrations/)."
              : " Check RLS `workshops_public_read`, env-keys en API-logs."}
          </p>
        </div>
      ) : null}

      <HeroCarousel slides={HERO_SLIDES} />

      <section
        id="studio"
        className="bg-japandi-white relative grid min-h-screen grid-cols-1 items-stretch lg:grid-cols-12"
      >
        <div className="content-layer flex max-w-4xl flex-col justify-center px-8 py-32 md:px-12 lg:col-span-5 lg:py-24 lg:pl-16 xl:pl-32">
          <span className="font-label text-japandi-blue mb-6 block text-[10px] font-bold tracking-[0.3em] uppercase">
            De Oude Brouwerij van Kampenhout
          </span>
          <h1 className="font-headline editorial-spacing text-japandi-charcoal mb-8 text-6xl leading-[1.1] font-light md:text-7xl xl:text-8xl">
            Creëer met je handen.
          </h1>
          <p className="font-body text-on-surface-variant mb-8 text-xl leading-relaxed font-light">
            Ontdek de tactiele vreugde van ambacht. <br />
            In onze studio op de prachtige site van de oude brouwerij van Kampenhout brengen we vakmanschap
            en moderne esthetiek samen. Een plek waar tijd vertraagt en creatie begint.
            <br />
            Een curatorschap van handwerk, van keramiek tot textielkunst, van houtbewerking tot
            plantenverzorging, in het hart van Vlaams-Brabant.
          </p>
          <div className="text-japandi-terracotta mb-12 text-3xl font-medium italic">
            waar verbeelding vorm krijgt
          </div>
          <div className="border-japandi-blue/20 border-l-2 py-2 pl-8">
            <p className="font-body text-on-surface-variant text-sm italic">
              &quot;Hier herontdekken we de rust in het maken.&quot;
            </p>
          </div>
        </div>
        <div className="content-layer relative pt-24 lg:col-span-7 lg:pt-32">
          <div className="relative h-full min-h-[320px] w-full lg:min-h-[480px]">
            <Image
              src={INTRO_IMAGE_SRC}
              alt="Ambachtelijke handen aan het werk"
              fill
              className="object-cover grayscale transition-all duration-1000 hover:grayscale-0"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </div>
        </div>
      </section>

      <HomeWorkshopsSection
        workshops={workshops}
        sessionCountByWorkshop={sessionCountByWorkshop}
      />

      <section
        id="locatie"
        className="border-outline-variant/5 bg-japandi-sand relative overflow-hidden border-t py-32"
      >
        <div className="content-layer mx-auto grid max-w-[1920px] grid-cols-1 items-center gap-16 px-8 md:grid-cols-2 lg:gap-24 lg:px-0 lg:pl-32">
          <div className="flex justify-center md:justify-start">
            <div className="border-outline-variant/20 shadow-japandi-charcoal/10 relative aspect-square w-full max-w-md overflow-hidden rounded-full border bg-white shadow-2xl">
              <Image
                src={LOCATION_IMAGE_SRC}
                alt="Brouwerij van Kampenhout"
                fill
                className="object-cover grayscale transition-all duration-1000 hover:grayscale-0"
                sizes="(max-width: 768px) 80vw, 400px"
              />
            </div>
          </div>
          <div className="pr-8 lg:pr-32">
            <h2 className="font-headline editorial-spacing text-japandi-charcoal mb-8 text-5xl font-light">
              Een Historische Site
              <div className="font-medium">Een Levend Erfgoed</div>
            </h2>
            <div className="font-body text-on-surface-variant mb-8 text-lg leading-relaxed font-light">
              <p className="text-on-surface-variant mb-4 leading-relaxed">
                Gelegen in het hart van Brabant, biedt de{" "}
                <span className="text-japandi-charcoal font-bold">Brouwerij van Kampenhout</span> een uniek
                decor voor creativiteit.
              </p>
              <p className="mb-4">
                Na meer dan 20 jaar stilstand wordt er sinds 2014 terug bier gebrouwen in Kampenhout door
                Kris Smedts en Mieke Nijs.
              </p>
              <p>
                In de schaduw van de koperen ketels waar het Witlov bier ontstaat, vindt Makerslabo zijn
                thuis. Een synergie tussen het ambacht van brouwen en het plezier van creëren.
              </p>
            </div>
            <div className="text-japandi-blue flex items-center space-x-4">
              <span className="material-symbols-outlined">location_on</span>
              <span className="font-label text-[10px] font-bold tracking-widest uppercase">
                Brouwerijstraat 1, Kampenhout
              </span>
            </div>
          </div>
        </div>
      </section>

      <NewsletterSection />

      <section id="about" className="sr-only" aria-hidden="true">
        About anchor for navigatie — inhoud volgt.
      </section>
      <section id="artists" className="sr-only" aria-hidden="true">
        Artists anchor voor navigatie — inhoud volgt.
      </section>
      <section id="shop" className="sr-only" aria-hidden="true">
        Shop anchor voor navigatie — inhoud volgt.
      </section>
    </>
  );
}
