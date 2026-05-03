import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (stripeClient === undefined) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
