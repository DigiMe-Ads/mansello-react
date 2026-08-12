"use client";

import { useEffect, useState } from "react";
import { getBooking } from "@/lib/api/bookings";
import type { Booking } from "@/lib/api/types";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 10;

// confirmPayment() resolving in the browser doesn't mean the booking is
// confirmed yet — that only happens once Stripe's webhook lands. Poll until
// it settles or we give up (worded as "still confirming", not an error).
export function usePollBookingStatus(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const result = await getBooking(bookingId!);
        if (cancelled) return;
        setBooking(result);
        if (result.status === "confirmed" || result.status === "cancelled") return;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to check booking status");
        return;
      }

      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingId]);

  return { booking, timedOut, error };
}
