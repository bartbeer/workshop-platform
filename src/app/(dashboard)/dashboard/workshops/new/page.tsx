import Link from "next/link";

import { WorkshopCreateForm } from "@/components/workshops/workshop-create-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NewWorkshopPage() {
  return (
    <div className="bg-japandi-sand flex min-h-0 flex-1 flex-col">
      <div className="content-layer mx-auto max-w-3xl px-8 py-16 md:py-24 lg:max-w-4xl">
        <header className="mb-12 md:text-left">
          <div className="mb-6 flex items-center justify-center gap-4 md:justify-start">
            <div className="bg-outline/25 hidden h-px w-12 md:block" />
            <span className="font-label text-outline text-xs font-bold tracking-[0.25em] uppercase">
              Teacher • cursus aanmaken
            </span>
          </div>
          <h1 className="font-headline text-japandi-charcoal editorial-spacing text-center text-4xl font-light md:text-left md:text-5xl">
            Nieuwe workshop
          </h1>
          <p className="font-body text-on-surface-variant mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed font-light md:mx-0 md:text-left">
            Vul de cursus in en voeg zelf de datums en tijden toe waarop je lesgeeft. Je kunt willekeurige
            combinaties kiezen (bijv. alleen zaterdagen, of verspreid over maanden).
          </p>
        </header>

        <WorkshopCreateForm />

        <div className="border-outline-variant/20 mt-14 border-t pt-10">
          <Button
            variant="outline"
            asChild
            className="border-japandi-charcoal/25 font-label rounded-none text-[10px] tracking-widest uppercase"
          >
            <Link href="/dashboard/workshops">Terug naar overzicht</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
