/**
 * Supabase Auth geeft o.a. "rate limit" bij te veel /recover of te veel auth-mail per uur (ingebouwde SMTP).
 */
export function formatPasswordResetError(raw: string): string {
  const m = raw.toLowerCase();
  if (
    m.includes("rate limit") ||
    m.includes("too many requests") ||
    m.includes("email rate limit")
  ) {
    return [
      "Er zijn te veel authenticatie-e-mails verstuurd in korte tijd (limiet van Supabase).",
      "Dat geldt projectbreed voor o.a. wachtwoord-reset, uitnodigingen en bevestigingsmails.",
      "Wacht een uur en probeer opnieuw, of pas in Supabase onder Authentication → Rate limits de waarden aan.",
      "Met custom SMTP kun je het uurlimiet voor mail vaak verruimen.",
    ].join(" ");
  }
  return raw;
}
