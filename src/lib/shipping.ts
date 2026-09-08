import type { ShippingRate } from "./api/types";

// Weight-based delivery fee. The admin configures a FLAT delivery price for
// each whole-kg band from 1 to 15: "a 3kg order ships for $9.99". The cart's
// total weight (unit weight x quantity, summed) is rounded up to the next
// whole kg, and whichever band that lands in gives the fee directly.
//
// This deliberately does NOT multiply by weight. It used to, while the field
// was named `pricePerKg`, which double-counted: bands are 1kg wide, so the
// band already encodes the weight. A 3kg order against a 9.99 band was being
// charged 3 x 9.99 = $29.97. See BACKEND_CHANGES_SHIPPING_FLAT_BAND_PRICING.md.
//
// Anything above the highest configured band uses that top band's price
// (documented assumption — there's no data to price heavier orders any other
// way until the admin adds more rows).

/** Reads the band's flat price, tolerating a backend still sending the old name. */
function priceOf(rate: ShippingRate): number {
  return Number(rate.price ?? rate.pricePerKg ?? 0);
}

export function computeShippingFee(rates: ShippingRate[], totalWeightKg: number): number {
  if (rates.length === 0 || totalWeightKg <= 0) return 0;

  const sorted = [...rates].sort((a, b) => a.fromKg - b.fromKg);
  const roundedKg = Math.max(1, Math.ceil(totalWeightKg));

  const band = sorted.find((r) => roundedKg >= r.fromKg && roundedKg <= r.toKg);
  if (band) return priceOf(band);

  // Pick the top band by the highest ceiling, not by position: `sorted` is
  // ordered by fromKg, so with overlapping bands the last entry is the one
  // that starts highest, which is not necessarily the one that ends highest.
  const top = sorted.reduce((a, b) => (b.toKg > a.toKg ? b : a));
  if (roundedKg > top.toKg) return priceOf(top);

  // No band matched but the weight is within the configured range, so it fell
  // into a gap between bands (e.g. bands of 1-3kg and 6-10kg, with a 4kg
  // order). Charge the nearest band at or below the weight — falling back to
  // the lowest rate here would systematically undercharge heavier orders.
  const below = sorted.filter((r) => r.toKg < roundedKg);
  if (below.length > 0) {
    return priceOf(below.reduce((a, b) => (b.toKg > a.toKg ? b : a)));
  }

  // Weight falls below the lowest configured band (e.g. rates start at 2kg) —
  // fall back to the lowest band's price rather than charging nothing.
  return priceOf(sorted[0]);
}

/**
 * True when the admin has actually configured any delivery pricing. All-zero
 * rows are the untouched default, and charging $0 because nobody filled the
 * form in is worse than falling back to the flat fee.
 */
export function hasConfiguredRates(rates: ShippingRate[] | null | undefined): boolean {
  return !!rates?.some((r) => priceOf(r) > 0);
}
