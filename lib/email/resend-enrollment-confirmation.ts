import { getSiteUrl } from "@/lib/site-url";
import { escapeHtml } from "@/lib/email/escape-html";
import { formatSessionDateTimeNl, type WorkshopEmailContext } from "@/lib/workshops/workshop-email-context";

type Args = {
  to: string;
  ctx: WorkshopEmailContext;
  participantCount: number;
};

/**
 * Alleen voor bestaande accounts (geen invite-mail). Vereist optioneel RESEND_API_KEY.
 * Zonder key: stil overslaan (Stripe stuurt sowieso een betalingsbewijs).
 */
export async function sendExistingUserEnrollmentConfirmationEmail(args: Args): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = process.env.RESEND_FROM?.trim() || "Workshop <onboarding@resend.dev>";
  const site = getSiteUrl();
  const workshopUrl = `${site}/workshops/${encodeURIComponent(args.ctx.workshopSlug)}`;
  const dashboardUrl = `${site}/dashboard`;

  const when = formatSessionDateTimeNl(args.ctx.startsAt);
  const loc = args.ctx.location?.trim() ? args.ctx.location : "wordt nog bevestigd";

  const subject = `Bevestiging: je bent ingeschreven voor ${args.ctx.workshopTitle}`;
  const html = `
<!DOCTYPE html>
<html lang="nl">
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Gefeliciteerd, je bent ingeschreven!</p>
  <p><strong>${escapeHtml(args.ctx.workshopTitle)}</strong></p>
  <ul>
    <li>Datum &amp; tijd: ${escapeHtml(when)}</li>
    <li>Locatie: ${escapeHtml(loc)}</li>
    <li>Aantal deelnemers: ${args.participantCount}</li>
  </ul>
  <p>Je kunt updates en praktische info over je workshop volgen via de website:</p>
  <p><a href="${workshopUrl}">Workshoppagina</a> · <a href="${dashboardUrl}">Mijn inschrijvingen</a></p>
  <p style="color:#555;font-size:14px;">Dit is een automatische bevestiging na je betaling.</p>
</body>
</html>`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[resend] enrollment confirmation failed", res.status, text);
  }
}
