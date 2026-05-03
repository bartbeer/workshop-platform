/** Dutch label for a session length (whole minutes). */
export function formatDurationNl(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 uur" : `${h} uur`;
  if (h === 0) return `${m} minuten`;
  return `${h} uur ${m} minuten`;
}
