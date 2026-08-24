import type { ShippingRate } from "./api/types";

// Weight-based delivery fee: admin configures a per-kg price for each whole
// kg from 1 to 15 (prices don't scale linearly, so each band is its own
// rate rather than one flat per-kg multiplier). See
// BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md.
//
// The cart's total weight is rounded up to the nearest kg band; anything
// above the highest configured band uses that top band's rate for the
// excess (documented assumption — there's no data to price heavier orders
// any other way until the admin adds more rows).
export function computeShippingFee(rates: ShippingRate[], totalWeightKg: number): number {
  if (rates.length === 0 || totalWeightKg <= 0) return 0;

  const sorted = [...rates].sort((a, b) => a.fromKg - b.fromKg);
  const roundedKg = Math.max(1, Math.ceil(totalWeightKg));

  const band = sorted.find((r) => roundedKg >= r.fromKg && roundedKg <= r.toKg);
  if (band) return roundedKg * Number(band.pricePerKg);

  const top = sorted[sorted.length - 1];
  if (roundedKg > top.toKg) return roundedKg * Number(top.pricePerKg);

  // Weight falls below the lowest configured band (e.g. rates start at 2kg) —
  // fall back to the lowest band's rate rather than charging nothing.
  return roundedKg * Number(sorted[0].pricePerKg);
}
