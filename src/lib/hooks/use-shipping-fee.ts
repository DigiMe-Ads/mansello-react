import { useEffect, useState } from "react";
import { getShippingRates } from "@/lib/api/marketplace";
import { computeShippingFee, hasConfiguredRates } from "@/lib/shipping";
import { FLAT_SHIPPING_FEE } from "@/lib/marketplace-config";
import { useCart } from "@/components/marketplace/cart-provider";
import type { ShippingRate } from "@/lib/api/types";

// Single source of truth for the delivery fee, shared by the cart and the
// checkout so the two pages can never quote different numbers.
//
// Previously the cart hardcoded FLAT_SHIPPING_FEE while only checkout fetched
// the real bands, so the fee visibly jumped between the two pages.
//
// `resolved` is the important flag: it is false while the rates are still in
// flight, and callers should show a placeholder rather than a number that is
// about to change under the customer.
export function useShippingFee(): {
  shippingFee: number;
  /** False while rates are still loading — don't render a total yet. */
  resolved: boolean;
  /** True when the fee is the flat fallback because no bands are configured. */
  usingFallback: boolean;
  rates: ShippingRate[] | null;
} {
  const { items, totalWeightKg } = useCart();
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getShippingRates()
      .then((result) => {
        if (!cancelled) setRates(result);
      })
      // A missing or failing endpoint is not an error the customer should
      // see — fall through to the flat fee.
      .catch(() => {
        if (!cancelled) setRates(null);
      })
      .finally(() => {
        if (!cancelled) setSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) {
    return { shippingFee: 0, resolved: true, usingFallback: false, rates };
  }

  const configured = hasConfiguredRates(rates);
  const shippingFee = configured ? computeShippingFee(rates!, totalWeightKg) : FLAT_SHIPPING_FEE;

  return { shippingFee, resolved: settled, usingFallback: settled && !configured, rates };
}
