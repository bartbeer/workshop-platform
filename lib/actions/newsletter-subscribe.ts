"use server";

export type NewsletterState = {
  ok: boolean;
  message: string;
};

export async function subscribeNewsletter(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    return { ok: false, message: "Vul een geldig e-mailadres in." };
  }

  return {
    ok: false,
    message: "Nieuwsbrief is nog niet geconfigureerd. Kom later terug of neem contact op.",
  };
}
