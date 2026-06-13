import { describe, expect, it } from "vitest";

import {
  bookingStatusesToCancelOnSessionCancel,
  shouldCancelBookingOnSessionCancel,
} from "@/lib/workshops/session-cancellation";

describe("shouldCancelBookingOnSessionCancel", () => {
  it("cancels confirmed and pending Bookings when a Session is cancelled", () => {
    expect(shouldCancelBookingOnSessionCancel("confirmed")).toBe(true);
    expect(shouldCancelBookingOnSessionCancel("pending")).toBe(true);
  });

  it("leaves already cancelled Bookings unchanged", () => {
    expect(shouldCancelBookingOnSessionCancel("cancelled")).toBe(false);
  });
});

describe("bookingStatusesToCancelOnSessionCancel", () => {
  it("lists the Booking statuses affected by Session cancellation", () => {
    expect(bookingStatusesToCancelOnSessionCancel()).toEqual(["pending", "confirmed"]);
  });
});
