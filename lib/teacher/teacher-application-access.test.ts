import { describe, expect, it } from "vitest";

import { canSubmitTeacherApplication } from "@/lib/teacher/teacher-application-access";

describe("canSubmitTeacherApplication", () => {
  it("allows a Participant without an open application to apply", () => {
    expect(
      canSubmitTeacherApplication({ role: "participant", applicationStatus: "none" }),
    ).toBe(true);
  });

  it("denies Teachers and Participants with a pending application", () => {
    expect(
      canSubmitTeacherApplication({ role: "participant", applicationStatus: "pending" }),
    ).toBe(false);
    expect(canSubmitTeacherApplication({ role: "teacher", applicationStatus: "none" })).toBe(
      false,
    );
  });
});
