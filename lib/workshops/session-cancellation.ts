export type BookingStatus = "pending" | "confirmed" | "cancelled";

export function bookingStatusesToCancelOnSessionCancel(): BookingStatus[] {
  return ["pending", "confirmed"];
}

export function shouldCancelBookingOnSessionCancel(status: string): boolean {
  return status === "pending" || status === "confirmed";
}
