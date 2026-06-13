import { describe, expect, it } from "vitest";

import { canManageWorkshopCatalog } from "@/lib/auth/workshop-catalog-access";

describe("canManageWorkshopCatalog", () => {
  it("allows the Owner to manage the Workshop catalog", () => {
    expect(canManageWorkshopCatalog("owner")).toBe(true);
  });

  it("denies Teachers and Participants from managing the Workshop catalog", () => {
    expect(canManageWorkshopCatalog("teacher")).toBe(false);
    expect(canManageWorkshopCatalog("participant")).toBe(false);
  });
});
