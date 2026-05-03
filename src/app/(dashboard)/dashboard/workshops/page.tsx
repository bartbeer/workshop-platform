import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function DashboardWorkshopsPage() {
  return (
    <div className="content-layer mx-auto flex w-full max-w-3xl flex-col gap-10 px-8 py-16 md:py-24">
      <header className="space-y-5 md:text-left">
        <div className="mb-2 flex items-center justify-center gap-4 md:justify-start">
          <div className="bg-outline/25 hidden h-px w-12 md:block" />
          <span className="font-label text-outline text-xs font-bold tracking-[0.25em] uppercase">
            Teacher
          </span>
        </div>
        <h1 className="font-headline text-japandi-charcoal text-center text-4xl font-light md:text-left md:text-5xl">
          Workshopbeheer
        </h1>
        <p className="font-body text-on-surface-variant text-center text-lg leading-relaxed font-light md:text-left">
          Alleen goedgekeurde teachers kunnen hier workshops beheren.
        </p>
      </header>
      <Button
        asChild
        className="w-fit rounded-none bg-japandi-blue font-label text-[10px] tracking-widest text-white uppercase hover:bg-japandi-blue/90"
      >
        <Link href="/dashboard/workshops/new">Nieuwe workshop</Link>
      </Button>
    </div>
  );
}
