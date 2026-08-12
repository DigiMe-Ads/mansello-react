"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePollBookingStatus } from "@/lib/hooks/use-poll-booking-status";
import { formatMoney } from "@/lib/currency";
import { formatDisplayDate } from "@/lib/date";

export function BookingConfirmationContent({ homeHref }: { homeHref: string }) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { booking, timedOut, error } = usePollBookingStatus(bookingId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EAF6FB] px-6 py-32">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-10 text-center shadow-lg">
        {!bookingId && <p className="text-sm text-slate-600">No booking reference found.</p>}

        {bookingId && error && (
          <>
            <h1 className="text-2xl font-bold text-[#153C4D]">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">{error}</p>
          </>
        )}

        {bookingId && !error && !booking && (
          <>
            <h1 className="text-2xl font-bold text-[#153C4D]">Confirming your booking...</h1>
            <p className="mt-3 text-sm text-slate-600">This usually takes just a moment.</p>
          </>
        )}

        {booking && booking.status === "confirmed" && (
          <>
            <h1 className="text-2xl font-bold text-[#8DC63F]">Booking Confirmed!</h1>
            <p className="mt-3 text-sm text-slate-600">
              A confirmation has been sent to {booking.guestEmail}.
            </p>
            <div className="mt-6 rounded-2xl bg-[#F7F5F0] p-6 text-left text-sm text-slate-700">
              <p>
                <span className="font-semibold">Check-in:</span> {formatDisplayDate(booking.checkIn.slice(0, 10))}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Check-out:</span> {formatDisplayDate(booking.checkOut.slice(0, 10))}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Guests:</span> {booking.guests}
              </p>
              {Number(booking.cityTax ?? 0) > 0 && (
                <>
                  <p className="mt-1">
                    <span className="font-semibold">Accommodation:</span>{" "}
                    {formatMoney(booking.accommodationPrice!, booking.currency)}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">City tax:</span> {formatMoney(booking.cityTax!, booking.currency)}
                  </p>
                </>
              )}
              <p className="mt-1">
                <span className="font-semibold">Total paid:</span> {formatMoney(booking.totalPrice, booking.currency)}
              </p>
            </div>
          </>
        )}

        {booking && booking.status === "cancelled" && (
          <>
            <h1 className="text-2xl font-bold text-[#153C4D]">Hold expired</h1>
            <p className="mt-3 text-sm text-slate-600">
              These dates were released because the hold expired before payment completed. Please start a new
              booking.
            </p>
          </>
        )}

        {booking && !["confirmed", "cancelled"].includes(booking.status) && timedOut && (
          <>
            <h1 className="text-2xl font-bold text-[#153C4D]">Still confirming</h1>
            <p className="mt-3 text-sm text-slate-600">
              Your payment is still being processed. We&apos;ll email you as soon as it&apos;s confirmed — no need to
              try again.
            </p>
          </>
        )}

        <Link
          href={homeHref}
          className="mt-8 inline-block rounded-full bg-[#153C4D] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0e2c38]"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
