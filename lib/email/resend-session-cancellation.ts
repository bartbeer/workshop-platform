import { getSiteUrl } from "@/lib/site-url";
import { escapeHtml } from "@/lib/email/escape-html";
import { formatSessionDateTimeNl, type WorkshopEmailContext } from "@/lib/workshops/workshop-email-context";

type Args = {
  to: string;
  ctx: WorkshopEmailContext;
  participantCount: number;
};

export async function sendSessionCancellationEmail(args: Args): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = process.env.RESEND_FROM?.trim() || "Workshop <onboarding@resend.dev>";
  const site = getSiteUrl();
  const workshopUrl = `${site}/workshops/${encodeURIComponent(args.ctx.workshopSlug)}`;
  const when = formatSessionDateTimeNl(args.ctx.startsAt);
  const loc = args.ctx.location?.trim() ? args.ctx.location : "wordt nog bevestigd";

  const subject = `Geannuleerd: ${args.ctx.workshopTitle}`;
  const html = `
<!DOCTYPE html>
<html lang="nl">
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>De sessie waarvoor je ingeschreven was, is geannuleerd door de organisator.</p>
  <p><strong>${escapeHtml(args.ctx.workshopTitle)}</strong></p>
  <ul>
    <li>Datum &amp; tijd: ${escapeHtml(when)}</li>
    <li>Locatie: ${escapeHtml(loc)}</li>
    <li>Aantal deelnemers op je boeking: ${args.participantCount}</li>
  </ul>
  <p>Heb je betaald? Terugbetalingen worden handmatig verwerkt — neem contact op met de organisator.</p>
  <p><a href="${workshopUrl}">Workshoppagina</a></p>
</body>
</html>`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [args.to], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[resend] session cancellation failed", res.status, text);
  }
}
