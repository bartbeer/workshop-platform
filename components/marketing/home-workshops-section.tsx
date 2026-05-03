import Image from "next/image";
import Link from "next/link";

import type { MarketingWorkshopRow } from "@/lib/workshops/fetch-public-workshops";
import { workshopImageSrc } from "@/lib/workshops/image-url";

export type HomeWorkshopCard = MarketingWorkshopRow;

type Props = {
  workshops: HomeWorkshopCard[];
  sessionCountByWorkshop: Map<string, number>;
};

const HOME_GRID_LIMIT = 6;

export function HomeWorkshopsSection({ workshops, sessionCountByWorkshop }: Props) {
  const preview = workshops.slice(0, HOME_GRID_LIMIT);

  return (
    <section className="relative bg-japandi-yellow-light/40 py-32">
      <div className="content-layer mx-auto max-w-screen-2xl px-8">
        <div className="mb-16 text-center">
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="bg-outline/20 h-[1px] w-12" />
            <span className="font-label text-outline text-xs font-bold tracking-[0.2em] uppercase">
              Onze Workshops
            </span>
            <div className="bg-outline/20 h-[1px] w-12" />
          </div>
        </div>

        {preview.length === 0 ? (
          <p className="font-body text-center text-on-surface-variant font-light">
            Nog geen workshops beschikbaar. Kom later terug.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {preview.map((workshop) => {
              const n = sessionCountByWorkshop.get(workshop.id) ?? 0;
              const excerpt =
                workshop.description?.replace(/\s+/g, " ").trim().slice(0, 160) ??
                "Ontdek deze workshop — alle datums en info op de detailpagina.";

              return (
                <Link
                  key={workshop.id}
                  href={`/workshops/${workshop.slug}`}
                  className="workshop-card border-outline-variant/30 group cursor-pointer border bg-white/20 p-4 backdrop-blur-sm"
                >
                  <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-none bg-white">
                    <Image
                      src={workshopImageSrc(workshop.image_path)}
                      alt={`Workshop ${workshop.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="space-y-2">
                    {n > 0 ? (
                      <span className="font-label text-japandi-terracotta text-[10px] font-bold tracking-[0.3em] uppercase">
                        {n === 1 ? "Eén datum" : `${n} datums`}
                      </span>
                    ) : (
                      <span className="font-label text-outline text-[10px] font-bold tracking-[0.3em] uppercase">
                        Data volgen
                      </span>
                    )}
                    <h3 className="font-headline text-japandi-charcoal text-3xl font-semibold">
                      {workshop.title}
                    </h3>
                    <p className="font-body text-on-surface-variant line-clamp-2 leading-relaxed font-light opacity-80">
                      {excerpt}
                    </p>
                    <div className="text-japandi-blue flex items-center pt-4 text-xs font-bold tracking-widest uppercase transition-all group-hover:gap-2">
                      Bekijk data
                      <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-16 flex justify-end">
          <Link
            href="/workshops"
            className="font-label bg-japandi-blue shadow-lg inline-flex items-center gap-2 px-8 py-3 text-[10px] font-bold tracking-widest text-white uppercase transition-all hover:opacity-90"
          >
            toon alle workshops
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
