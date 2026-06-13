import { describe, expect, it } from "vitest";

import { canMarkBookingAttendance } from "@/lib/workshops/booking-attendance-access";

describe("canMarkBookingAttendance", () => {
  it("allows the assigned Teacher to mark attendance", () => {
    expect(
      canMarkBookingAttendance({
        actorUserId: "teacher-1",
        actorRole: "teacher",
        sessionTeacherUserId: "teacher-1",
      }),
    ).toBe(true);
  });

  it("denies Teachers not assigned to the Session", () => {
    expect(
      canMarkBookingAttendance({
        actorUserId: "teacher-2",
        actorRole: "teacher",
        sessionTeacherUserId: "teacher-1",
      }),
    ).toBe(false);
  });

  it("allows Owner to mark attendance on any Session", () => {
    expect(
      canMarkBookingAttendance({
        actorUserId: "owner-1",
        actorRole: "owner",
        sessionTeacherUserId: "teacher-1",
      }),
    ).toBe(true);
  });
});
