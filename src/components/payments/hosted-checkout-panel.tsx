"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { formatMoney } from "@/lib/currency";

// Payments.lk (Sri Lanka) takes the card on its own hosted page, not in an
// embedded form like Stripe: the backend creates the checkout and hands back
// its URL, and we send the guest there. They come back to the confirmation
// page (successUrl), which waits for the backend to confirm the payment from
// Payments.lk's webhook — the return itself proves nothing. See
// BACKEND_CHANGES_VARIANTS_CALENDAR_PAYMENTS_LK.md §3.

// Remembered across the redirect so the order confirmation page only clears
// the cart for the order that was actually paid, never for an old link.
export const PENDING_ORDER_KEY = "mansello_pending_order";

export function HostedCheckoutPanel({
  checkoutUrl,
  amount,
  currency,
  chargeAmount,
  chargeCurrency,
  countdown,
  pendingOrderId,
  children,
}: {
  checkoutUrl: string;
  /** The price as listed (e.g. USD). */
  amount: string | number;
  currency: string;
  /** What the card is actually charged, when it differs (e.g. LKR). */
  chargeAmount?: string | null;
  chargeCurrency?: string | null;
  /** e.g. "Hold expires in 12:30" — bookings only. */
  countdown?: React.ReactNode;
  pendingOrderId?: string;
  /** Price breakdown rendered above the button. */
  children?: React.ReactNode;
}) {
  const [leaving, setLeaving] = useState(false);
  const converted =
    chargeAmount != null && chargeCurrency && chargeCurrency.toLowerCase() !== currency.toLowerCase();

  function go() {
    setLeaving(true);
    if (pendingOrderId) {
      try {
        window.sessionStorage.setItem(PENDING_ORDER_KEY, pendingOrderId);
      } catch {
        // storage blocked — the cart just isn't auto-cleared afterwards
      }
    }
    window.location.assign(checkoutUrl);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#153C4D]">Payment</h3>
        {countdown}
      </div>

      {children}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center justify-between font-semibold text-[#153C4D]">
          <span>You&apos;ll be charged</span>
          <span>
            {converted ? formatMoney(chargeAmount!, chargeCurrency!) : formatMoney(amount, currency)}
          </span>
        </div>
        {converted && (
          <p className="mt-1 text-xs text-slate-500">
            {formatMoney(amount, currency)} converted to {chargeCurrency!.toUpperCase()} at today&apos;s rate. Your
            bank may show a small difference if your card is in another currency.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={go}
        disabled={leaving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
      >
        <Lock size={16} />
        {leaving ? "Opening secure payment..." : "Continue to secure payment"}
      </button>
      <p className="text-center text-xs text-slate-400">
        You&apos;ll pay by card on Payments.lk&apos;s secure page, then come straight back here. Your card details never
        touch our site.
      </p>
    </div>
  );
}

/** Banner for the page Payments.lk's cancelUrl returns to (`?payment=cancelled`). */
export function PaymentCancelledNotice({ message }: { message: string }) {
  const [show] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("payment") === "cancelled";
  });
  if (!show) return null;
  return <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>;
}
