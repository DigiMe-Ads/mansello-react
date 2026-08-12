"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { BookingProvider, usePropertyBooking } from "./booking-provider";
import { MonthGridView } from "./booking-calendar-view";
import { buildMonthGrid, formatDisplayDate, nextMonth, todayKey } from "@/lib/date";
import { computeStayTotal, guestCountOptions, nightsBetween } from "@/lib/api/pricing";
import { formatMoney } from "@/lib/currency";
import { isRangeAvailable } from "@/lib/availability";

const MAX_MONTH_OFFSET = 10;

// Compact date-range + guests widget for the homepage — same property/
// availability APIs as the full booking calendar on the Airbnb page, just a
// smaller picker. "Reserve" hands the chosen dates off to that page instead
// of re-implementing guest details/payment here.
function ReservationWidgetInner({ airbnbHref }: { airbnbHref: string }) {
  const { property, loading, error, blockedDates, checkIn, checkOut, guests, selectDay, setGuests } =
    usePropertyBooking();
  const router = useRouter();

  const [openPicker, setOpenPicker] = useState<"checkIn" | "checkOut" | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const today = todayKey();

  // Mirrors booking-provider's own range-selection logic so the popover can
  // close itself the moment a click completes a valid check-in/check-out
  // pair, without reacting to state after the fact in an effect.
  function handleSelect(key: string) {
    selectDay(key);
    if (checkIn && !checkOut && key > checkIn && isRangeAvailable(blockedDates, checkIn, key)) {
      setOpenPicker(null);
    }
  }

  const base = useMemo(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [today]);

  const visible = useMemo(() => {
    let cur = base;
    for (let i = 0; i < monthOffset; i++) cur = nextMonth(cur.year, cur.month);
    return cur;
  }, [base, monthOffset]);

  const grid = buildMonthGrid(visible.year, visible.month);
  const guestOptions = property ? guestCountOptions(property.pricingTiers) : [];

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const stay =
    property && checkIn && checkOut ? computeStayTotal(property.pricingTiers, checkIn, checkOut, guests, 1) : null;
  const minNightsOk = !property || nights === 0 || nights >= property.minNights;
  const canReserve = Boolean(checkIn && checkOut && stay && minNightsOk);

  function handleReserve() {
    if (!checkIn || !checkOut) return;
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    router.push(`${airbnbHref}?${params.toString()}#booking`);
  }

  if (loading) {
    return <p className="mt-8 text-sm text-slate-400">Loading availability...</p>;
  }

  if (error || !property) {
    return <p className="mt-8 text-sm text-red-600">{error ?? "Unable to load availability right now."}</p>;
  }

  return (
    <div className="mt-8 max-w-md">
      <div className="relative">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOpenPicker((p) => (p === "checkIn" ? null : "checkIn"))}
            className="rounded-xl bg-white px-4 py-2.5 text-left shadow-sm"
          >
            <span className="block text-xs font-medium text-slate-400">Check-In</span>
            <span className="mt-0.5 flex items-center justify-between gap-1 text-sm font-semibold text-[#1B4B4F]">
              {checkIn ? formatDisplayDate(checkIn) : "Select"}
              <ChevronDown size={16} className="shrink-0 text-slate-400" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpenPicker((p) => (p === "checkOut" ? null : "checkOut"))}
            className="rounded-xl bg-white px-4 py-2.5 text-left shadow-sm"
          >
            <span className="block text-xs font-medium text-slate-400">Check-Out</span>
            <span className="mt-0.5 flex items-center justify-between gap-1 text-sm font-semibold text-[#1B4B4F]">
              {checkOut ? formatDisplayDate(checkOut) : "Select"}
              <ChevronDown size={16} className="shrink-0 text-slate-400" />
            </span>
          </button>
        </div>

        {openPicker && (
          <>
            <button
              type="button"
              aria-label="Close calendar"
              onClick={() => setOpenPicker(null)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="absolute left-0 right-0 top-full z-20 mt-2 w-72 rounded-2xl bg-white p-4 shadow-xl">
              <MonthGridView
                grid={grid}
                today={today}
                checkIn={checkIn}
                checkOut={checkOut}
                blockedDates={blockedDates}
                onSelect={handleSelect}
                showPrevArrow={monthOffset > 0}
                showNextArrow={monthOffset < MAX_MONTH_OFFSET}
                onPrev={() => setMonthOffset((v) => Math.max(0, v - 1))}
                onNext={() => setMonthOffset((v) => Math.min(MAX_MONTH_OFFSET, v + 1))}
              />
            </div>
          </>
        )}
      </div>

      <label className="mt-3 block rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <span className="block text-xs font-medium text-slate-400">Guests</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="mt-0.5 w-full bg-transparent text-sm font-semibold text-[#1B4B4F] outline-none"
        >
          {guestOptions.map((g) => (
            <option key={g} value={g}>
              {g} Guest{g > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </label>

      {stay ? (
        <p className="mt-3 text-sm font-semibold text-[#1B4B4F]">
          {formatMoney(stay.totalPrice, property.currency)} · {stay.nights} night{stay.nights > 1 ? "s" : ""}
        </p>
      ) : (
        checkIn &&
        checkOut &&
        !minNightsOk && (
          <p className="mt-3 text-xs text-red-600">
            Minimum stay is {property.minNights} night{property.minNights > 1 ? "s" : ""}
          </p>
        )
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!canReserve}
          onClick={handleReserve}
          className="rounded-full bg-[#8DC63F] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1F3D2E] shadow-md transition hover:bg-[#72A62E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reserve
        </button>
        <Link
          href={airbnbHref}
          className="rounded-full bg-[#8DC63F] px-6 py-3 text-sm font-semibold text-[#1F3D2E] shadow-md transition hover:bg-[#72A62E]"
        >
          View Rooms &amp; Rates
        </Link>
      </div>
    </div>
  );
}

export function ReservationWidget({ propertySlug, airbnbHref }: { propertySlug: string; airbnbHref: string }) {
  return (
    <BookingProvider propertySlug={propertySlug}>
      <ReservationWidgetInner airbnbHref={airbnbHref} />
    </BookingProvider>
  );
}
