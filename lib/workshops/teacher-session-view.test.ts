import { describe, expect, it } from "vitest";

import { isSessionStarted, isUpcomingSession } from "@/lib/workshops/teacher-session-view";

describe("isUpcomingSession", () => {
  it("returns true when the Session start is in the future", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(isUpcomingSession("2026-07-01T12:00:00Z", now)).toBe(true);
  });

  it("returns false when the Session start is in the past", () => {
    const now = new Date("2026-08-01T12:00:00Z");
    expect(isUpcomingSession("2026-07-01T12:00:00Z", now)).toBe(false);
  });
});

describe("isSessionStarted", () => {
  it("returns true when the Session start is in the past", () => {
    const now = new Date("2026-08-01T12:00:00Z");
    expect(isSessionStarted("2026-07-01T12:00:00Z", now)).toBe(true);
  });

  it("returns false when the Session start is in the future", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(isSessionStarted("2026-07-01T12:00:00Z", now)).toBe(false);
  });
});
