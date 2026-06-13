export function isUpcomingSession(startsAt: string, now = new Date()): boolean {
  return new Date(startsAt).getTime() >= now.getTime();
}
