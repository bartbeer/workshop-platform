import type { Stripe } from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

import { sendExistingUserEnrollmentConfirmationEmail } from "@/lib/email/resend-enrollment-confirmation";

import { inviteNewGuestUser, lookupUserIdByEmail } from "./enrollment-user";
import { assertSessionCapacity } from "./session-capacity";
import { fetchWorkshopEmailContext } from "./workshop-email-context";

function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  return raw.trim().toLowerCase();
}

function logFulfillSkip(reason: string, sessionId: string, extra?: Record<string, unknown>) {
  console.error(`[workshop stripe fulfill] ${reason}`, { sessionId, ...extra });
}

/**
 * Ingelogde checkout zet client_reference_id = auth user id. Die gebruiken we als die user hetzelfde
 * e-mailadres heeft als Stripe (voorkomt mismatch tussen RPC-lookup en het account waar je op inlogt).
 */
async function resolvePurchaserUserId(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  clientReferenceId: string | null | undefined,
): Promise<string | null> {
  const ref = clientReferenceId?.trim();
  if (ref && /^[0-9a-f-]{36}$/i.test(ref)) {
    const { data: refData, error: refErr } = await admin.auth.admin.getUserById(ref);
    if (!refErr && refData.user?.email) {
      const accountEmail = normalizeEmail(refData.user.email);
      if (accountEmail === email) {
        return ref;
      }
      console.warn("[workshop stripe fulfill] client_reference_id past niet bij checkout-e-mail", {
        client_reference_id: ref,
        checkoutEmail: email,
        accountEmail,
      });
    }
  }
  return lookupUserIdByEmail(admin, email);
}

async function refundCheckoutIfPossible(session: Stripe.Checkout.Session): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!piId) return;
  try {
    await stripe.refunds.create({ payment_intent: piId });
  } catch {
    // Handmatige refund in Stripe Dashboard indien nodig
  }
}

/**
 * Idempotent: dezelfde Stripe checkout session wordt maximaal één keer verwerkt.
 * Haalt de sessie opnieuw op bij Stripe: webhook-payloads zijn soms onvolledig (e-mail/metadata).
 */
export async function fulfillStripeCheckoutSession(incoming: Stripe.Checkout.Session): Promise<void> {
  const stripe = getStripe();
  if (!stripe) {
    logFulfillSkip("STRIPE_SECRET_KEY ontbreekt", incoming.id);
    throw new Error("Stripe client ontbreekt");
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(incoming.id);
  } catch (e) {
    console.error("[workshop stripe fulfill] sessions.retrieve mislukt", e);
    throw e;
  }

  if (session.mode !== "payment") {
    logFulfillSkip("geen payment mode", session.id, { mode: session.mode });
    return;
  }

  if (session.payment_status !== "paid") {
    logFulfillSkip("payment nog niet paid (wacht op async_payment_succeeded of andere betaalmethode)", session.id, {
      payment_status: session.payment_status,
    });
    return;
  }

  const email = normalizeEmail(session.customer_details?.email ?? session.customer_email);
  if (!email) {
    logFulfillSkip("geen klant-e-mail op sessie", session.id);
    return;
  }

  const workshopSessionId = session.metadata?.workshop_session_id?.trim() ?? "";
  const participantCount = Number(session.metadata?.participant_count ?? NaN);
  if (!workshopSessionId || Number.isNaN(participantCount)) {
    logFulfillSkip("metadata workshop_session_id / participant_count ontbreekt of ongeldig", session.id, {
      metadata: session.metadata,
    });
    return;
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[workshop stripe fulfill] SUPABASE_SERVICE_ROLE_KEY ontbreekt of ongeldig", e);
    throw e;
  }

  const { error: lockError } = await admin.from("workshop_checkout_fulfillments").insert({
    stripe_checkout_session_id: session.id,
  });
  if (lockError) {
    if (lockError.code === "23505") return;
    throw lockError;
  }

  try {
    let userId = await resolvePurchaserUserId(admin, email, session.client_reference_id);
    let invitedNewUser = false;

    const emailCtx = await fetchWorkshopEmailContext(admin, workshopSessionId);
    if (!emailCtx) {
      throw new Error("Workshop-sessie niet gevonden voor e-mailcontext");
    }

    if (!userId) {
      const capNew = await assertSessionCapacity(admin, workshopSessionId, participantCount, null);
      if (!capNew.ok) {
        await refundCheckoutIfPossible(session);
        return;
      }
      try {
        userId = await inviteNewGuestUser(admin, email, {
          ...emailCtx,
          participantCount,
        });
        invitedNewUser = true;
      } catch {
        userId = await lookupUserIdByEmail(admin, email);
        if (!userId) throw new Error("Gebruiker aanmaken na betaling mislukt");
      }
    }

    const cap = await assertSessionCapacity(admin, workshopSessionId, participantCount, userId);
    if (!cap.ok) {
      await refundCheckoutIfPossible(session);
      return;
    }

    const { error: bookingError } = await admin.from("workshop_bookings").upsert(
      {
        user_id: userId,
        workshop_session_id: workshopSessionId,
        participant_count: participantCount,
        status: "confirmed",
      },
      { onConflict: "user_id,workshop_session_id" },
    );
    if (bookingError) throw bookingError;

    await admin
      .from("workshop_checkout_fulfillments")
      .update({
        user_id: userId,
        workshop_session_id: workshopSessionId,
        participant_count: participantCount,
      })
      .eq("stripe_checkout_session_id", session.id);

    if (!invitedNewUser) {
      await sendExistingUserEnrollmentConfirmationEmail({
        to: email,
        ctx: emailCtx,
        participantCount,
      });
    }
  } catch (e) {
    await admin.from("workshop_checkout_fulfillments").delete().eq("stripe_checkout_session_id", session.id);
    throw e;
  }
}
