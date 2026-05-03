/**
 * Voorkomt open redirects na login: alleen relatieve paden op dezelfde origin.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate || typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}
