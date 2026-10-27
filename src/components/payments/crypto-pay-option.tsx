"use client";

import { useEffect, useState } from "react";
import { Bitcoin } from "lucide-react";
import { getPaymentMethods, startBookingCryptoCheckout, startOrderCryptoCheckout } from "@/lib/api/payments";
import { ApiRequestError } from "@/lib/api/errors";
import { PENDING_ORDER_KEY } from "@/components/payments/hosted-checkout-panel";

// "Pay with crypto instead" — an alternative to the card form on every
// checkout (Italy and Sri Lanka bookings, marketplace orders). The backend
// turns the pending booking/order into a NOWPayments invoice and we send the
// customer to its hosted page, where they pick the coin. They come back to
// the usual confirmation page, which waits for the backend to confirm the
// payment from NOWPayments' webhook. Hidden when crypto isn't configured.

let methodsPromise: Promise<{ crypto: boolean }> | null = null;

function useCryptoEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    methodsPromise ??= getPaymentMethods().catch(() => ({ crypto: false }));
    methodsPromise.then((m) => {
      if (!cancelled) setEnabled(m.crypto);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return enabled;
}

export function CryptoPayOption({ kind, id }: { kind: "booking" | "order"; id: string }) {
  const enabled = useCryptoEnabled();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!enabled) return null;

  async function payWithCrypto() {
    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } =
        kind === "booking" ? await startBookingCryptoCheckout(id) : await startOrderCryptoCheckout(id);
      if (kind === "order") {
        try {
          window.sessionStorage.setItem(PENDING_ORDER_KEY, id);
        } catch {
          // storage blocked — the cart just isn't auto-cleared afterwards
        }
      }
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't start the crypto payment — please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={payWithCrypto}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#153C4D] py-3 text-sm font-bold text-[#153C4D] transition hover:bg-[#153C4D] hover:text-white disabled:opacity-60"
      >
        <Bitcoin size={18} />
        {busy ? "Opening crypto payment..." : "Pay with crypto"}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">
        Bitcoin, USDT, Ethereum and 100+ other coins via NOWPayments. Crypto can take a little longer to confirm{kind === "booking" ? " — your dates stay held while it does" : ""}.
      </p>
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
