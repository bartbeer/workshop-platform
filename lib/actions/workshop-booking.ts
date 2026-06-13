"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { sendExistingUserEnrollmentConfirmationEmail } from "@/lib/email/resend-enrollment-confirmation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { getStripe } from "@/lib/stripe/server";
import { inviteNewGuestUser, lookupUserIdByEmail } from "@/lib/workshops/enrollment-user";
import {
  capacityBookingErrorParam,
  sessionBookingBlockReason,
} from "@/lib/workshops/session-booking-eligibility";
import { assertSessionCapacity } from "@/lib/workshops/session-capacity";
import { fetchWorkshopEmailContext } from "@/lib/workshops/workshop-email-context";

function normalizeGuestEmail(raw: FormDataEntryValue | null): string | null {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

export async function subscribeToSession(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const safePath = getSafeRedirectPath(`/workshops/${slug}`, "/workshops");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sessionId = String(formData.get("sessionId") ?? "");
  const participantCount = Number(formData.get("participantCount") ?? 1);
  if (!sessionId || Number.isNaN(participantCount) || participantCount < 1 || participantCount > 20) {
    redirect(`${safePath}?error=invalid`);
  }

  const { data: session } = await supabase
    .from("workshop_sessions")
    .select("id, max_participants, price_cents, workshop_id, status")
    .eq("id", sessionId)
    .maybeSingle<{
      id: string;
      max_participants: number;
      price_cents: number | null;
      workshop_id: string;
      status: "scheduled" | "cancelled";
    }>();

  const sessionBlock = sessionBookingBlockReason(session);
  if (sessionBlock) {
    redirect(`${safePath}?error=${capacityBookingErrorParam(sessionBlock)}`);
  }

  if (!session) {
    redirect(`${safePath}?error=missing_session`);
  }

  const { data: workshop } = await supabase
    .from("workshops")
    .select("title, price_cents, slug")
    .eq("id", session.workshop_id)
    .maybeSingle<{ title: string; price_cents: number | null; slug: string }>();

  if (!workshop || workshop.slug !== slug) {
    redirect(`${safePath}?error=missing_session`);
  }

  const pricePerPersonCents = session.price_cents ?? workshop.price_cents;
  const isPaid = pricePerPersonCents != null && pricePerPersonCents > 0;

  const guestEmail = user ? null : normalizeGuestEmail(formData.get("guestEmail"));
  if (!user && !guestEmail) {
    redirect(`${safePath}?error=email_required`);
  }

  const payerEmail = (user?.email ?? guestEmail ?? "").trim().toLowerCase();
  if (isPaid && !payerEmail) {
    redirect(`${safePath}?error=email_required`);
  }

  if (isPaid) {
    const stripe = getStripe();
    if (!stripe) {
      redirect(`${safePath}?error=stripe_config`);
    }

    const cap = await assertSessionCapacity(supabase, sessionId, participantCount, user?.id ?? null);
    if (!cap.ok) {
      redirect(`${safePath}?error=${capacityBookingErrorParam(cap.reason)}`);
    }

    const origin = getSiteUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payerEmail,
      client_reference_id: user?.id,
      metadata: {
        workshop_session_id: sessionId,
        participant_count: String(participantCount),
        slug,
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pricePerPersonCents,
            product_data: {
              name: `${workshop.title} — inschrijving`,
            },
          },
          quantity: participantCount,
        },
      ],
      success_url: `${origin}/workshops/payment-return?session_id={CHECKOUT_SESSION_ID}&out=success`,
      cancel_url: `${origin}/workshops/payment-return?session_id={CHECKOUT_SESSION_ID}&out=cancel`,
    });

    if (!checkout.url) {
      redirect(`${safePath}?error=stripe_session`);
    }

    redirect(checkout.url);
  }

  if (user) {
    const cap = await assertSessionCapacity(supabase, sessionId, participantCount, user.id);
    if (!cap.ok) {
      redirect(`${safePath}?error=${capacityBookingErrorParam(cap.reason)}`);
    }

    await supabase.from("workshop_bookings").upsert(
      {
        user_id: user.id,
        workshop_session_id: sessionId,
        participant_count: participantCount,
        status: "confirmed",
      },
      { onConflict: "user_id,workshop_session_id" },
    );

    revalidatePath(safePath);
    revalidatePath("/dashboard");
    redirect(`${safePath}?status=subscribed`);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`${safePath}?error=server_config`);
  }

  try {
    const emailCtx = await fetchWorkshopEmailContext(admin, sessionId);
    if (!emailCtx) {
      redirect(`${safePath}?error=missing_session`);
    }

    let userId = await lookupUserIdByEmail(admin, guestEmail!);
    let didInvite = false;

    if (!userId) {
      const capNew = await assertSessionCapacity(admin, sessionId, participantCount, null);
      if (!capNew.ok) {
        redirect(`${safePath}?error=${capacityBookingErrorParam(capNew.reason)}`);
      }
      try {
        userId = await inviteNewGuestUser(admin, guestEmail!, {
          ...emailCtx,
          participantCount,
        });
        didInvite = true;
      } catch {
        userId = await lookupUserIdByEmail(admin, guestEmail!);
        if (!userId) {
          redirect(`${safePath}?error=booking_failed`);
        }
      }
    } else {
      const capEx = await assertSessionCapacity(admin, sessionId, participantCount, userId);
      if (!capEx.ok) {
        redirect(`${safePath}?error=${capacityBookingErrorParam(capEx.reason)}`);
      }
    }

    const { error: bookingError } = await admin.from("workshop_bookings").upsert(
      {
        user_id: userId,
        workshop_session_id: sessionId,
        participant_count: participantCount,
        status: "confirmed",
      },
      { onConflict: "user_id,workshop_session_id" },
    );
    if (bookingError) {
      redirect(`${safePath}?error=booking_failed`);
    }

    if (!didInvite) {
      await sendExistingUserEnrollmentConfirmationEmail({
        to: guestEmail!,
        ctx: emailCtx,
        participantCount,
      });
    }
  } catch {
    redirect(`${safePath}?error=booking_failed`);
  }

  revalidatePath(safePath);
  revalidatePath("/dashboard");
  redirect(`${safePath}?status=subscribed`);
}

export async function cancelSessionBooking(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const safePath = getSafeRedirectPath(`/workshops/${slug}`, "/workshops");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(safePath)}`);
  }

  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) {
    redirect(safePath);
  }

  await supabase
    .from("workshop_bookings")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("workshop_session_id", sessionId);

  revalidatePath(safePath);
  revalidatePath("/dashboard");
  redirect(`${safePath}?status=cancelled`);
}
