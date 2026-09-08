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

  // Pick the top band by the highest ceiling, not by position: `sorted` is
  // ordered by fromKg, so with overlapping bands the last entry is the one
  // that starts highest, which is not necessarily the one that ends highest.
  const top = sorted.reduce((a, b) => (b.toKg > a.toKg ? b : a));
  if (roundedKg > top.toKg) return roundedKg * Number(top.pricePerKg);

  // No band matched but the weight is within the configured range, so it fell
  // into a gap between bands (e.g. bands of 1–3kg and 6–10kg, with a 4kg
  // order). Charge the nearest band at or below the weight — falling back to
  // the lowest rate here would systematically undercharge heavier orders.
  const below = sorted.filter((r) => r.toKg < roundedKg);
  if (below.length > 0) {
    const nearest = below.reduce((a, b) => (b.toKg > a.toKg ? b : a));
    return roundedKg * Number(nearest.pricePerKg);
  }

  // Weight falls below the lowest configured band (e.g. rates start at 2kg) —
  // fall back to the lowest band's rate rather than charging nothing.
  return roundedKg * Number(sorted[0].pricePerKg);
}
