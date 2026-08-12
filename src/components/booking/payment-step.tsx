"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { formatMoney } from "@/lib/currency";
import { usePropertyBooking } from "./booking-provider";

function PaymentForm({ confirmationPath }: { confirmationPath: string }) {
  const { booking, reset } = usePropertyBooking();
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countdown = useCountdown(booking?.expiresAt ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !booking) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${confirmationPath}?bookingId=${booking.id}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`${confirmationPath}?bookingId=${booking.id}`);
  }

  if (countdown.expired) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm font-medium text-amber-800">
          Your hold expired before payment was completed. Please start again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#72A62E]"
        >
          Start Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#153C4D]">Payment</h3>
        <span className="rounded-full bg-[#153C4D]/10 px-3 py-1 text-xs font-semibold text-[#153C4D]">
          Hold expires in {String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
        </span>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {booking && Number(booking.cityTax ?? 0) > 0 && (
        <div className="mt-4 rounded-2xl bg-[#F7F5F0] px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Accommodation</span>
            <span>{formatMoney(booking.accommodationPrice!, booking.currency)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>City tax</span>
            <span>{formatMoney(booking.cityTax!, booking.currency)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-[#153C4D]">
            <span>Total</span>
            <span>{formatMoney(booking.totalPrice, booking.currency)}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mt-6 w-full rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
      >
        {submitting ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export function PaymentStep({ confirmationPath }: { confirmationPath: string }) {
  const { property, clientSecret } = usePropertyBooking();
  if (!property || !clientSecret) return null;

  return (
    <Elements
      stripe={getStripePromise(property.stripeAccountRef)}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <PaymentForm confirmationPath={confirmationPath} />
    </Elements>
  );
}
