import { describe, expect, it } from "vitest";

import { validateSessionTeacherAssignments } from "@/lib/workshops/session-teacher-assignment";

describe("validateSessionTeacherAssignments", () => {
  it("accepts when every Session has an assigned Teacher from the allowed list", () => {
    const teachers = new Set(["t1", "t2"]);
    expect(
      validateSessionTeacherAssignments(
        [{ teacher_user_id: "t1" }, { teacher_user_id: "t2" }],
        teachers,
      ),
    ).toEqual({ ok: true });
  });

  it("rejects a Session without an assigned Teacher", () => {
    expect(
      validateSessionTeacherAssignments([{ teacher_user_id: "" }], new Set(["t1"])),
    ).toEqual({ ok: false, reason: "missing_teacher" });
  });

  it("rejects a Teacher who is not on the allowed list", () => {
    expect(
      validateSessionTeacherAssignments([{ teacher_user_id: "unknown" }], new Set(["t1"])),
    ).toEqual({ ok: false, reason: "invalid_teacher" });
  });
});
