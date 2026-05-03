"use client";

import { useActionState } from "react";

import {
  subscribeNewsletter,
  type NewsletterState,
} from "@/lib/actions/newsletter-subscribe";

const initialState: NewsletterState = { ok: false, message: "" };

export function NewsletterSection() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialState);

  return (
    <section
      id="newsletter"
      className="border-outline-variant/5 relative border-y bg-japandi-cream px-8 py-24"
    >
      <div className="content-layer mx-auto max-w-4xl text-center">
        <h2 className="font-headline mb-8 text-4xl font-light text-japandi-charcoal italic md:text-5xl">
          Blijf op de hoogte
        </h2>
        <p className="font-body mx-auto mb-12 max-w-2xl text-lg font-light opacity-80">
          Ontvang als eerste bericht over nieuwe workshopdata, gastdocenten en evenementen in ons
          atelier rechtstreeks in je mailbox.
        </p>
        <form action={formAction} className="mx-auto flex max-w-lg flex-col gap-4 md:flex-row">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={pending}
            className="font-body placeholder:text-outline/40 focus:ring-japandi-blue flex-1 rounded-none border-none bg-white px-6 py-4 text-sm shadow-sm focus:ring-1"
            placeholder="Je e-mailadres"
          />
          <button
            type="submit"
            disabled={pending}
            className="font-label bg-japandi-blue rounded-none px-10 py-4 text-xs font-bold tracking-widest text-white uppercase shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "…" : "Inschrijven"}
          </button>
        </form>
        {state.message ? (
          <p
            className={`font-body mt-4 text-sm ${state.ok ? "text-japandi-teal" : "text-japandi-terracotta"}`}
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
