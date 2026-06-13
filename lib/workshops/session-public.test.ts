import { describe, expect, it } from "vitest";

import {
  formatTeacherLabel,
  isSessionBookable,
  partitionSessionsByStatus,
} from "@/lib/workshops/session-public";

describe("isSessionBookable", () => {
  it("returns true for a scheduled Session", () => {
    expect(isSessionBookable("scheduled")).toBe(true);
  });

  it("returns false for a cancelled Session", () => {
    expect(isSessionBookable("cancelled")).toBe(false);
  });
});

describe("partitionSessionsByStatus", () => {
  it("separates bookable and cancelled Sessions for the public catalog", () => {
    const sessions = [
      { id: "a", status: "scheduled" as const },
      { id: "b", status: "cancelled" as const },
      { id: "c", status: "scheduled" as const },
    ];

    expect(partitionSessionsByStatus(sessions)).toEqual({
      bookable: [{ id: "a", status: "scheduled" }, { id: "c", status: "scheduled" }],
      cancelled: [{ id: "b", status: "cancelled" }],
    });
  });
});

describe("formatTeacherLabel", () => {
  it("prefers a full name when available", () => {
    expect(formatTeacherLabel({ fullName: "Jan Peeters", email: "jan@example.com" })).toBe(
      "Jan Peeters",
    );
  });

  it("falls back to the email local part", () => {
    expect(formatTeacherLabel({ fullName: null, email: "jan@example.com" })).toBe("jan");
  });
});
