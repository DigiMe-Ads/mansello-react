import type { CityTaxBand, Offer, PricingTier, Property, RateOverride, Room, TransportRate } from "./types";
import { addDaysToKey } from "../date";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function findPricingTier(tiers: PricingTier[], guestCount: number, rooms = 1): PricingTier | null {
  return tiers.find((t) => t.guestCount === guestCount && t.rooms === rooms) ?? null;
}

export function guestCountOptions(tiers: PricingTier[]): number[] {
  return Array.from(new Set(tiers.map((t) => t.guestCount))).sort((a, b) => a - b);
}

export function roomOptionsForGuestCount(tiers: PricingTier[], guestCount: number): number[] {
  return tiers
    .filter((t) => t.guestCount === guestCount)
    .map((t) => t.rooms)
    .sort((a, b) => a - b);
}

// For an "adults + children" guest picker: given a chosen adult count, which
// child counts still land on a total that actually has a pricing tier? E.g.
// tiers for 1-4 guests and 2 adults selected -> children can be 0, 1 or 2.
export function childrenOptionsForAdults(tiers: PricingTier[], adults: number): number[] {
  return Array.from(
    new Set(
      guestCountOptions(tiers)
        .filter((g) => g >= adults)
        .map((g) => g - adults)
    )
  ).sort((a, b) => a - b);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY);
}

// Every night's date-key of a stay, e.g. ["2026-06-01", "2026-06-02"] for a
// 2-night 06-01 -> 06-03 stay. Used to resolve per-night rate overrides and
// per-night discounts instead of one flat price for the whole stay.
export function nightlyDateKeys(checkIn: string, checkOut: string): string[] {
  const keys: string[] = [];
  let cursor = checkIn;
  while (cursor < checkOut) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return keys;
}

export interface StayTotal {
  nights: number;
  pricePerNight: number;
  totalPrice: number;
}

export function computeStayTotal(
  tiers: PricingTier[],
  checkIn: string,
  checkOut: string,
  guestCount: number,
  rooms = 1
): StayTotal | null {
  const tier = findPricingTier(tiers, guestCount, rooms);
  if (!tier) return null;

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return null;

  const pricePerNight = Number(tier.pricePerNight);
  return { nights, pricePerNight, totalPrice: pricePerNight * nights };
}

// --- City/tourist tax (e.g. Bologna) — per guest, per night, banded by the
// accommodation's price-per-person/night, exempt under a given age, and
// capped at a maximum number of nights (the room itself is still charged for
// every night — only the *tax* stops accruing after the cap). See
// BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md for the per-night version
// used once rate overrides/discounts are in play, and
// BACKEND_CHANGES_CITY_TAX.md for the authoritative server-side version of
// this same calculation; this client copy is a preview only.

export interface CityTaxResult {
  taxableGuests: number;
  taxedNights: number;
  // The band rate that applied — null if no band matched, or if different
  // nights of the stay landed in different bands (varying nightly price via
  // rate overrides) and there's no single rate to show.
  ratePerPersonPerNight: number | null;
  cityTax: number;
}

function findCityTaxBand(bands: CityTaxBand[], pricePerPersonPerNight: number): CityTaxBand | null {
  return (
    bands.find(
      (b) =>
        pricePerPersonPerNight >= b.minPricePerPersonPerNight &&
        (b.maxPricePerPersonPerNight === null || pricePerPersonPerNight <= b.maxPricePerPersonPerNight)
    ) ?? null
  );
}

export function computeCityTax(
  property: Pick<Property, "cityTaxEnabled" | "cityTaxMaxNights" | "cityTaxExemptAgeUnder" | "cityTaxBands">,
  pricePerNight: number,
  guests: number,
  nights: number,
  childrenUnder14: number
): CityTaxResult | null {
  if (!property.cityTaxEnabled || !property.cityTaxBands?.length) return null;

  const taxableGuests = Math.max(0, guests - Math.max(0, Math.min(childrenUnder14, guests)));
  const taxedNights = Math.min(nights, property.cityTaxMaxNights ?? nights);
  const pricePerPersonPerNight = pricePerNight / guests;
  const band = findCityTaxBand(property.cityTaxBands, pricePerPersonPerNight);

  return {
    taxableGuests,
    taxedNights,
    ratePerPersonPerNight: band?.ratePerPersonPerNight ?? null,
    cityTax: band ? taxableGuests * taxedNights * band.ratePerPersonPerNight : 0,
  };
}

// Per-night version of computeCityTax — each of the stay's first
// `cityTaxMaxNights` nights (in chronological order; tax stops accruing
// after that many nights) is banded off its own price-per-person/night,
// since rate overrides can make that vary night to night.
function computeCityTaxForNights(
  property: Pick<Property, "cityTaxEnabled" | "cityTaxMaxNights" | "cityTaxExemptAgeUnder" | "cityTaxBands">,
  nightlyPrices: number[],
  guests: number,
  childrenUnder14: number
): CityTaxResult | null {
  if (!property.cityTaxEnabled || !property.cityTaxBands?.length) return null;

  const taxableGuests = Math.max(0, guests - Math.max(0, Math.min(childrenUnder14, guests)));
  const taxedNights = Math.min(nightlyPrices.length, property.cityTaxMaxNights ?? nightlyPrices.length);

  let cityTax = 0;
  let uniformRate: number | null | undefined; // undefined = not yet seen, null = varies
  for (let i = 0; i < taxedNights; i++) {
    const pricePerPersonPerNight = nightlyPrices[i] / guests;
    const band = findCityTaxBand(property.cityTaxBands, pricePerPersonPerNight);
    const rate = band?.ratePerPersonPerNight ?? 0;
    cityTax += taxableGuests * rate;
    const bandRate = band?.ratePerPersonPerNight ?? null;
    if (uniformRate === undefined) uniformRate = bandRate;
    else if (uniformRate !== bandRate) uniformRate = null;
  }

  return { taxableGuests, taxedNights, ratePerPersonPerNight: uniformRate ?? null, cityTax };
}

export interface StayBreakdown extends StayTotal {
  accommodationPrice: number;
  cityTax: number;
  grandTotal: number;
  cityTaxDetail: CityTaxResult | null;
  // Pre-discount accommodation price, for a strike-through "was" price.
  // Equal to accommodationPrice when no discount applies.
  originalAccommodationPrice: number;
  discountAmount: number;
  // Only set when every night of the stay got the same % off — keeps the
  // "X% OFF" badge honest instead of implying a uniform discount that isn't
  // actually uniform (e.g. an offer window covering only part of the stay).
  discountPercentApplied?: number;
  // One-off airport-transfer charge, 0 when not requested or not offered.
  // Included in grandTotal.
  transportPrice: number;
}

export function computeStayBreakdown(
  tiers: PricingTier[],
  checkIn: string,
  checkOut: string,
  guestCount: number,
  rooms: number,
  property: Pick<Property, "cityTaxEnabled" | "cityTaxMaxNights" | "cityTaxExemptAgeUnder" | "cityTaxBands">,
  childrenUnder14 = 0,
  rateOverrides: RateOverride[] = [],
  offers: Offer[] = [],
  transportPrice = 0
): StayBreakdown | null {
  const tier = findPricingTier(tiers, guestCount, rooms);
  if (!tier) return null;

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return null;

  const dateKeys = nightlyDateKeys(checkIn, checkOut);
  const basePrices = dateKeys.map((date) => resolveNightlyPriceForTier(tier, rateOverrides, date));

  return buildBreakdownFromNightlyPrices(
    dateKeys, basePrices, nights, guestCount, property, childrenUnder14, offers, transportPrice
  );
}

// --- Individually-bookable rooms (e.g. Dona's Villa) — pricing is the sum
// of the selected rooms' own nightly rates, instead of a guestCount/rooms
// pricing tier. See BACKEND_CHANGES_SRI_LANKA_ROOMS.md.

export function totalRoomCapacity(rooms: Room[]): number {
  return rooms.reduce((sum, r) => sum + r.capacity, 0);
}

export function computeRoomsStayTotal(
  rooms: Room[],
  selectedRoomIds: string[],
  checkIn: string,
  checkOut: string
): StayTotal | null {
  if (selectedRoomIds.length === 0) return null;

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return null;

  const selected = rooms.filter((r) => selectedRoomIds.includes(r.id));
  if (selected.length !== selectedRoomIds.length) return null; // an id didn't match a known room

  const pricePerNight = selected.reduce((sum, r) => sum + Number(r.pricePerNight), 0);
  return { nights, pricePerNight, totalPrice: pricePerNight * nights };
}

// Cheapest way to cover `guests` worth of capacity, picking whole rooms
// greedily by price — used for "from" price previews before the guest has
// actually picked which rooms they want (e.g. the homepage's quick widget).
// Not necessarily what they'll end up paying once they pick rooms
// themselves in the full booking flow.
export function estimateCheapestRoomsTotal(rooms: Room[], guests: number, nights: number): StayTotal | null {
  if (nights < 1) return null;

  const sorted = [...rooms].sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight));
  let covered = 0;
  let pricePerNight = 0;
  for (const room of sorted) {
    if (covered >= guests) break;
    covered += room.capacity;
    pricePerNight += Number(room.pricePerNight);
  }
  if (covered < guests) return null; // not enough total capacity for this many guests

  return { nights, pricePerNight, totalPrice: pricePerNight * nights };
}

export function computeRoomsStayBreakdown(
  rooms: Room[],
  selectedRoomIds: string[],
  checkIn: string,
  checkOut: string,
  guestCount: number,
  property: Pick<Property, "cityTaxEnabled" | "cityTaxMaxNights" | "cityTaxExemptAgeUnder" | "cityTaxBands">,
  childrenUnder14 = 0,
  rateOverrides: RateOverride[] = [],
  offers: Offer[] = [],
  transportPrice = 0
): StayBreakdown | null {
  if (selectedRoomIds.length === 0) return null;

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return null;

  const selected = rooms.filter((r) => selectedRoomIds.includes(r.id));
  if (selected.length !== selectedRoomIds.length) return null; // an id didn't match a known room

  const dateKeys = nightlyDateKeys(checkIn, checkOut);
  const basePrices = dateKeys.map((date) =>
    selected.reduce((sum, r) => sum + resolveNightlyPriceForRoom(r, rateOverrides, date), 0)
  );

  return buildBreakdownFromNightlyPrices(
    dateKeys, basePrices, nights, guestCount, property, childrenUnder14, offers, transportPrice
  );
}

export interface PricingMatrix {
  guestCounts: number[];
  roomCounts: number[];
  matrix: Record<number, Record<number, PricingTier | undefined>>;
}

// For properties like Dona's Villa where the same guest count is priced
// differently depending on room count — renders as a guests × rooms table.
export function pivotTiersByRooms(tiers: PricingTier[]): PricingMatrix {
  const guestCounts = guestCountOptions(tiers);
  const roomCounts = Array.from(new Set(tiers.map((t) => t.rooms))).sort((a, b) => a - b);

  const matrix: Record<number, Record<number, PricingTier | undefined>> = {};
  for (const g of guestCounts) {
    matrix[g] = {};
    for (const r of roomCounts) {
      matrix[g][r] = findPricingTier(tiers, g, r) ?? undefined;
    }
  }

  return { guestCounts, roomCounts, matrix };
}

// --- Rate overrides (seasonal/peak pricing) & offers (discounts) — resolved
// per night, then folded into a StayBreakdown. See
// BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md.

function dateWithinRange(dateKey: string, startDate: string, endDate: string): boolean {
  return dateKey >= startDate.slice(0, 10) && dateKey <= endDate.slice(0, 10);
}

/**
 * Airport-transfer price for a party of this size, or null when the property
 * offers no transfer or has no row for that guest count.
 *
 * Quoted per party, not per person — a transfer for 4 is one vehicle. It is a
 * one-off charge on the booking, never multiplied by nights.
 */
export function resolveTransportPrice(
  rates: TransportRate[] | undefined,
  guestCount: number
): number | null {
  const match = rates?.find((r) => r.guestCount === guestCount && r.active);
  return match ? Number(match.price) : null;
}

export function resolveNightlyPriceForRoom(room: Room, overrides: RateOverride[], dateKey: string): number {
  const match = overrides.find((o) => o.roomId === room.id && dateWithinRange(dateKey, o.startDate, o.endDate));
  return Number(match ? match.pricePerNight : room.pricePerNight);
}

export function resolveNightlyPriceForTier(tier: PricingTier, overrides: RateOverride[], dateKey: string): number {
  const match = overrides.find(
    (o) => o.guestCount === tier.guestCount && o.rooms === tier.rooms && dateWithinRange(dateKey, o.startDate, o.endDate)
  );
  return Number(match ? match.pricePerNight : tier.pricePerNight);
}

function offerCoversNight(offer: Offer, dateKey: string): boolean {
  if (!offer.active) return false;
  if (offer.startDate && dateKey < offer.startDate.slice(0, 10)) return false;
  if (offer.endDate && dateKey > offer.endDate.slice(0, 10)) return false;
  return true;
}

// Highest discountPercent among offers covering this night — offers don't
// stack, the best one wins.
export function resolveDiscountPercentForNight(offers: Offer[], dateKey: string): number {
  const matching = offers.filter((o) => offerCoversNight(o, dateKey));
  if (!matching.length) return 0;
  return Math.max(...matching.map((o) => o.discountPercent));
}

// Shared by computeStayBreakdown / computeRoomsStayBreakdown once each has
// resolved its own (pre-discount) per-night base prices.
function buildBreakdownFromNightlyPrices(
  dateKeys: string[],
  basePrices: number[],
  nights: number,
  guestCount: number,
  property: Pick<Property, "cityTaxEnabled" | "cityTaxMaxNights" | "cityTaxExemptAgeUnder" | "cityTaxBands">,
  childrenUnder14: number,
  offers: Offer[],
  transportPrice = 0
): StayBreakdown {
  const discountPercents = dateKeys.map((date) => resolveDiscountPercentForNight(offers, date));
  const finalPrices = basePrices.map((price, i) => price * (1 - discountPercents[i] / 100));

  const originalAccommodationPrice = basePrices.reduce((sum, p) => sum + p, 0);
  const accommodationPrice = finalPrices.reduce((sum, p) => sum + p, 0);
  const discountAmount = originalAccommodationPrice - accommodationPrice;

  const uniformDiscount = discountPercents.every((d) => d === discountPercents[0]) ? discountPercents[0] : undefined;
  const discountPercentApplied = uniformDiscount && uniformDiscount > 0 ? uniformDiscount : undefined;

  const cityTaxDetail = computeCityTaxForNights(property, finalPrices, guestCount, childrenUnder14);
  const cityTax = cityTaxDetail?.cityTax ?? 0;

  return {
    nights,
    pricePerNight: originalAccommodationPrice / nights,
    totalPrice: accommodationPrice,
    accommodationPrice,
    originalAccommodationPrice,
    discountAmount,
    discountPercentApplied,
    cityTax,
    transportPrice,
    grandTotal: accommodationPrice + cityTax + transportPrice,
    cityTaxDetail,
  };
}
