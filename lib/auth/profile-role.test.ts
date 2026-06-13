import { describe, expect, it } from "vitest";

import { resolveProfileRole } from "@/lib/auth/profile-role";

describe("resolveProfileRole", () => {
  it("returns participant when the profile role is participant", () => {
    expect(
      resolveProfileRole({
        storedRole: "participant",
        teacherApplicationStatus: "none",
      }),
    ).toBe("participant");
  });

  it("returns participant when no profile role is stored", () => {
    expect(
      resolveProfileRole({
        storedRole: null,
        teacherApplicationStatus: "none",
      }),
    ).toBe("participant");
  });

  it("returns owner when the profile role is owner", () => {
    expect(
      resolveProfileRole({
        storedRole: "owner",
        teacherApplicationStatus: "none",
      }),
    ).toBe("owner");
  });

  it("returns teacher when the profile role is teacher", () => {
    expect(
      resolveProfileRole({
        storedRole: "teacher",
        teacherApplicationStatus: "none",
      }),
    ).toBe("teacher");
  });

  it("returns teacher when a teacher application is approved", () => {
    expect(
      resolveProfileRole({
        storedRole: "participant",
        teacherApplicationStatus: "approved",
      }),
    ).toBe("teacher");
  });
});
