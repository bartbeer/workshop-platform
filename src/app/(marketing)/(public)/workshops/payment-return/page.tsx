import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { fulfillStripeCheckoutSession } from "@/lib/workshops/checkout-fulfillment";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(v: string | string[] | undefined): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

/**
 * Stripe stuurt de klant hierheen na betaling/annuleren.
 * We lezen de checkout session op (betrouwbare metadata.slug) en controleren of de workshop bestaat.
 */
export default async function WorkshopPaymentReturnPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sessionId = firstString(sp.session_id);
  const out = firstString(sp.out) ?? "success";

  if (!sessionId) {
    redirect("/workshops");
  }

  const stripe = getStripe();
  if (!stripe) {
    redirect("/workshops?error=stripe_config");
  }

  let session: import("stripe").Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/workshops");
  }

  const slug = session.metadata?.slug?.trim() ?? "";
  const isCancel = out === "cancel";

  if (!slug) {
    redirect(isCancel ? "/workshops?checkout=cancel" : "/workshops?checkout=success");
  }

  const safePath = getSafeRedirectPath(`/workshops/${slug}`, "/workshops");

  const supabase = await createClient();
  const { data: workshop } = await supabase.from("workshops").select("slug").eq("slug", slug).maybeSingle();

  if (!workshop) {
    redirect(
      `/workshops?checkout=${isCancel ? "cancel" : "success"}&error=workshop_not_found`,
    );
  }

  if (isCancel) {
    redirect(`${safePath}?checkout=cancel`);
  }

  // Fallback: als Stripe webhook lokaal/temporair niet aankomt, verwerken we hier alsnog idempotent.
  try {
    await fulfillStripeCheckoutSession(session);
  } catch (error) {
    console.error("[workshop payment-return] fallback fulfillment mislukt", error);
    redirect("/workshops?checkout=success&warning=fulfillment_pending");
  }

  // Na succesvolle betaling terug naar overzicht voor een frisse lijst/capaciteit.
  redirect("/workshops?checkout=success");
}
