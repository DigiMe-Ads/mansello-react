"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe";
import { formatMoney } from "@/lib/currency";
import type { Order } from "@/lib/api/types";

// Card payment for a marketplace order — same Stripe account and the same
// Elements/confirmPayment shape as the villa booking flow's PaymentStep
// (src/components/booking/payment-step.tsx), just without a hold-expiry
// countdown: an order doesn't (currently) reserve stock with a time limit
// the way a booking holds dates, so there's nothing to count down to. See
// BACKEND_CHANGES_MARKETPLACE_PAYMENTS.md.
function PaymentForm({
  order,
  confirmationPath,
  onPaid,
}: {
  order: Order;
  confirmationPath: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${confirmationPath}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    // Only clear the cart once payment has actually gone through — not
    // when the (still-pending) order was first created.
    onPaid();
    router.push(confirmationPath);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-[#153C4D]">Payment</h2>
      <p className="text-sm text-slate-500">
        Paid securely by card — the same payment gateway used for villa bookings.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mt-2 w-full rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
      >
        {submitting ? "Processing..." : `Pay ${formatMoney(order.total, "usd")}`}
      </button>
    </form>
  );
}

export function CheckoutPaymentStep({
  order,
  clientSecret,
  confirmationPath,
  onPaid,
}: {
  order: Order;
  clientSecret: string;
  confirmationPath: string;
  onPaid: () => void;
}) {
  return (
    <Elements stripe={getStripePromise("sri_lanka")} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <PaymentForm order={order} confirmationPath={confirmationPath} onPaid={onPaid} />
    </Elements>
  );
}
