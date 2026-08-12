import type { CityTaxBand, PricingTier, Property } from "./types";

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

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY);
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
// BACKEND_CHANGES_CITY_TAX.md for the authoritative server-side version of
// this same calculation; this client copy is a preview only.

export interface CityTaxResult {
  taxableGuests: number;
  taxedNights: number;
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

export interface StayBreakdown extends StayTotal {
  accommodationPrice: number;
  cityTax: number;
  grandTotal: number;
  cityTaxDetail: CityTaxResult | null;
}

export function computeStayBreakdown(
  tiers: PricingTier[],
  checkIn: string,
  checkOut: string,
  guestCount: number,
  rooms: number,
  property: Pick<Property, "cityTaxEnabled" | "cityTaxMaxNights" | "cityTaxExemptAgeUnder" | "cityTaxBands">,
  childrenUnder14 = 0
): StayBreakdown | null {
  const stay = computeStayTotal(tiers, checkIn, checkOut, guestCount, rooms);
  if (!stay) return null;

  const cityTaxDetail = computeCityTax(property, stay.pricePerNight, guestCount, stay.nights, childrenUnder14);
  const cityTax = cityTaxDetail?.cityTax ?? 0;

  return {
    ...stay,
    accommodationPrice: stay.totalPrice,
    cityTax,
    grandTotal: stay.totalPrice + cityTax,
    cityTaxDetail,
  };
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
