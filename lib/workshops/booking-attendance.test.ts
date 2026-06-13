import { describe, expect, it } from "vitest";

import {
  formatAttendanceSummary,
  isSessionOpenForAttendanceMarking,
  validatePresentCount,
} from "@/lib/workshops/booking-attendance";

describe("validatePresentCount", () => {
  it("accepts present count within booked spot total", () => {
    expect(validatePresentCount(2, 3)).toEqual({ ok: true });
  });

  it("rejects present count above booked spot total", () => {
    expect(validatePresentCount(4, 3)).toEqual({ ok: false, reason: "too_many_present" });
  });

  it("rejects negative present count", () => {
    expect(validatePresentCount(-1, 3)).toEqual({ ok: false, reason: "invalid_count" });
  });
});

describe("formatAttendanceSummary", () => {
  it("shows unmarked when no record exists", () => {
    expect(formatAttendanceSummary(null, 3)).toBe("Nog niet gemarkeerd");
  });

  it("shows present count out of total spots", () => {
    expect(formatAttendanceSummary(2, 3)).toBe("2 van 3 aanwezig");
  });

  it("shows fully absent when present count is zero", () => {
    expect(formatAttendanceSummary(0, 2)).toBe("0 van 2 aanwezig");
  });
});

describe("isSessionOpenForAttendanceMarking", () => {
  it("allows marking after the Session has started", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    expect(isSessionOpenForAttendanceMarking("2026-06-01T12:00:00Z", now)).toBe(true);
  });

  it("blocks marking before the Session start time", () => {
    const now = new Date("2026-06-01T11:00:00Z");
    expect(isSessionOpenForAttendanceMarking("2026-06-01T12:00:00Z", now)).toBe(false);
  });
});
