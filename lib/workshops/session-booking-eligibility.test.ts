import { describe, expect, it } from "vitest";

import { sessionBookingBlockReason, capacityBookingErrorParam } from "@/lib/workshops/session-booking-eligibility";

describe("sessionBookingBlockReason", () => {
  it("blocks Bookings on a cancelled Session", () => {
    expect(sessionBookingBlockReason({ status: "cancelled" })).toBe("cancelled");
  });

  it("allows Bookings on a scheduled Session", () => {
    expect(sessionBookingBlockReason({ status: "scheduled" })).toBe(null);
  });
});

describe("capacityBookingErrorParam", () => {
  it("maps a cancelled Session to a public error code", () => {
    expect(capacityBookingErrorParam("cancelled")).toBe("session_cancelled");
  });
});
