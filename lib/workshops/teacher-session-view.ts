export function isUpcomingSession(startsAt: string, now = new Date()): boolean {
  return new Date(startsAt).getTime() >= now.getTime();
}

export function isSessionStarted(startsAt: string, now = new Date()): boolean {
  return new Date(startsAt).getTime() <= now.getTime();
}
