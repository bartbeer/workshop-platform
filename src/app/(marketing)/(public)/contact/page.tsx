import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met Makerslabo — e-mailadres, hoofdzetel en ondernemingsgegevens (voorbeeld).",
};

export default function ContactPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-24 h-[420px] w-[420px] rounded-full bg-secondary-container opacity-[0.07] blur-[90px]" />
        <div className="absolute top-1/2 -right-20 h-[360px] w-[360px] rounded-full bg-primary-fixed-dim opacity-[0.07] blur-[90px]" />
      </div>

      <div className="content-layer relative z-10 mx-auto max-w-3xl px-8 pt-28 pb-24 md:pb-32">
        <header className="mb-14 space-y-6 md:text-left">
          <div className="flex items-center justify-center gap-4 md:justify-start">
            <div className="bg-outline/25 hidden h-px w-12 md:block" />
            <span className="font-label text-outline text-xs font-bold tracking-[0.25em] uppercase">
              Contact
            </span>
          </div>
          <h1 className="font-headline text-japandi-charcoal text-center text-4xl font-light md:text-left md:text-5xl lg:text-6xl">
            Laten we iets maken
          </h1>
          <p className="font-body text-on-surface-variant mx-auto max-w-xl text-center text-lg leading-relaxed font-light md:mx-0 md:text-left">
            Vragen over workshops, studioverhuur of samenwerkingen? Stuur ons een bericht — we lezen
            alles met plezier.
          </p>
          <div className="bg-japandi-charcoal/15 mx-auto h-px w-16 md:mx-0" />
        </header>

        <div className="space-y-8">
          <section className="border-outline-variant/25 bg-white/95 rounded-none border p-8 shadow-none backdrop-blur-sm md:p-10">
            <h2 className="font-label text-japandi-charcoal mb-4 text-[10px] font-bold tracking-[0.28em] uppercase">
              E-mail
            </h2>
            <p className="font-body text-on-surface-variant mb-3 text-sm leading-relaxed font-light">
              Voor algemene vragen en inschrijvingen:
            </p>
            <a
              href="mailto:info@makerslabo.com"
              className="font-headline text-marketing-primary text-2xl font-light tracking-tight underline-offset-4 transition-opacity hover:underline hover:opacity-90 md:text-3xl"
            >
              info@makerslabo.com
            </a>
          </section>

          <section className="border-outline-variant/25 bg-japandi-cream/60 rounded-none border p-8 backdrop-blur-sm md:p-10">
            <h2 className="font-label text-japandi-charcoal mb-6 text-[10px] font-bold tracking-[0.28em] uppercase">
              Hoofdzetel
            </h2>
            <address className="font-body text-on-surface space-y-1 text-lg leading-relaxed font-light not-italic">
              Makerslabo BV
              <br />
              Voorbeeldstraat 24
              <br />
              1910 Kampenhout
              <br />
              België
            </address>
          </section>

          <section className="border-outline-variant/25 bg-white/95 rounded-none border p-8 shadow-none backdrop-blur-sm md:p-10">
            <h2 className="font-label text-japandi-charcoal mb-4 text-[10px] font-bold tracking-[0.28em] uppercase">
              BTW-nummer
            </h2>
            <p className="font-headline text-japandi-charcoal mb-2 text-xl font-light tracking-wide md:text-2xl">
              BE0888.777.666
            </p>
            <p className="font-body text-on-surface-variant text-sm leading-relaxed font-light">
              Dit is een tijdelijk voorbeeldnummer voor op de website — het echte ondernemingsnummer
              volgt wanneer de entiteit definitief is geregistreerd.
            </p>
          </section>

          <p className="font-body text-on-surface-variant/80 border-outline-variant/20 rounded-none border border-dashed px-5 py-4 text-center text-xs leading-relaxed md:text-left">
            Het hoofdzeteladres en BTW-nummer op deze pagina zijn fictief en dienen enkel als
            placeholder tijdens de opbouw van het platform.
          </p>
        </div>

        <p className="font-body text-on-surface-variant mt-14 text-center text-sm font-light md:text-left">
          <Link href="/" className="font-label text-marketing-primary text-[10px] tracking-widest uppercase underline-offset-4 hover:underline">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  );
}
