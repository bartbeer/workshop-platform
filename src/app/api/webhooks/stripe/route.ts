import { NextResponse } from "next/server";

import { fulfillStripeCheckoutSession } from "@/lib/workshops/checkout-fulfillment";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json(
      {
        error: "Stripe webhook niet geconfigureerd",
        missing: {
          stripeSecretKey: !stripe,
          stripeWebhookSecret: !secret,
        },
      },
      { status: 501 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Geen handtekening" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Ongeldige webhook" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    try {
      await fulfillStripeCheckoutSession(session);
    } catch (e) {
      console.error("[workshop stripe webhook] fulfillment error", e);
      return NextResponse.json({ error: "Fulfillment mislukt" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
