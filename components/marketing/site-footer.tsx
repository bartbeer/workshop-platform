import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-outline-variant/5 relative overflow-hidden border-t bg-japandi-cream">
      <div className="content-layer mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-16 px-8 py-24 md:grid-cols-4 lg:px-32">
        <div className="space-y-8">
          <Link href="/" className="font-headline block text-2xl font-extrabold tracking-tight text-japandi-charcoal">
            Makerslabo
          </Link>
          <p className="font-body max-w-xs text-sm leading-relaxed font-light text-on-surface-variant">
            Een plek voor makers, dromers en doeners in het hart van Kampenhout.
          </p>
          <div className="flex space-x-6">
            <a
              className="font-label text-japandi-blue text-[10px] font-bold tracking-widest uppercase underline-offset-4 hover:underline"
              href="https://instagram.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Instagram
            </a>
            <a
              className="font-label text-japandi-blue text-[10px] font-bold tracking-widest uppercase underline-offset-4 hover:underline"
              href="https://facebook.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Facebook
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-label mb-8 text-[10px] font-extrabold tracking-widest text-japandi-charcoal uppercase">
            Ontdek
          </h4>
          <ul className="font-body space-y-4 text-sm font-light text-on-surface-variant">
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/workshops">
                Workshops
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#studio">
                Studioverhuur
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#artists">
                Onze Artists
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#shop">
                Webshop
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-label mb-8 text-[10px] font-extrabold tracking-widest text-japandi-charcoal uppercase">
            Informatie
          </h4>
          <ul className="font-body space-y-4 text-sm font-light text-on-surface-variant">
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#privacy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#terms">
                Terms
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#newsletter">
                Contact
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-japandi-blue" href="/#locatie">
                Locatie
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:text-right">
          <h4 className="font-label mb-8 text-[10px] font-extrabold tracking-widest text-japandi-charcoal uppercase">
            Adres
          </h4>
          <address className="font-body space-y-1 text-sm not-italic leading-relaxed font-light text-on-surface-variant">
            Brouwerij van Campenhout
            <br />
            Brouwerijstraat 1<br />
            1910 Kampenhout, Belgium
          </address>
          <p className="font-label mt-8 text-[9px] font-bold tracking-widest text-on-surface-variant/60 uppercase">
            © {new Date().getFullYear()} Makerslabo. Located in Kampenhout.
          </p>
        </div>
      </div>
    </footer>
  );
}
