import type { TransportRate } from "./api/types";

// Fallback airport-transfer prices, used until the backend serves the real
// ones (see BACKEND_CHANGES_VILLA_TRANSPORT.md). Same idea as
// testimonials-seed-data.ts: the feature stays visible and testable before its
// endpoint exists, and the database becomes the only source of truth the
// moment it does.
//
// Priced per party, not per person — a transfer for four is one vehicle.
// Dona's Villa is 25 minutes from Colombo Airport (CMB); The Nest Bologna is
// 13 minutes from Bologna Marconi (BLQ).
//
// TO DISABLE: return [] from seedTransportRates() below, or set the property's
// transportEnabled to false once the backend supports it.

function rates(propertySlug: string, prices: Record<number, number>): TransportRate[] {
  return Object.entries(prices).map(([guestCount, price]) => ({
    id: `seed-${propertySlug}-${guestCount}`,
    propertyId: propertySlug,
    guestCount: Number(guestCount),
    price: price.toFixed(2),
    active: true,
  }));
}

const SEED_BY_SLUG: Record<string, TransportRate[]> = {
  "donas-villa": rates("donas-villa", { 1: 25, 2: 25, 3: 35, 4: 35, 5: 50, 6: 50, 7: 60, 8: 60 }),
  "the-nest-bologna": rates("the-nest-bologna", { 1: 30, 2: 30, 3: 45, 4: 45 }),
};

/** Seed rates for a property, or [] if it has none configured here. */
export function seedTransportRates(propertySlug: string | undefined): TransportRate[] {
  return (propertySlug && SEED_BY_SLUG[propertySlug]) || [];
}
