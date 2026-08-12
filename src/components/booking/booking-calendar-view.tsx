"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { usePropertyBooking } from "./booking-provider";
import { GuestDetailsForm } from "./guest-details-form";
import { buildMonthGrid, formatDisplayDate, nextMonth, todayKey, type MonthGridData } from "@/lib/date";
import { computeStayBreakdown, guestCountOptions, nightsBetween, roomOptionsForGuestCount } from "@/lib/api/pricing";
import { formatMoney } from "@/lib/currency";

// Stripe's SDK is only needed once a guest reaches the payment step, so it's
// kept out of this page's initial JS bundle instead of loading for every
// visitor who's just browsing dates.
const PaymentStep = dynamic(() => import("./payment-step").then((m) => m.PaymentStep), {
  ssr: false,
  loading: () => <p className="mx-auto max-w-md text-center text-sm text-slate-500">Loading payment form...</p>,
});

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_MONTH_OFFSET = 10;

export function MonthGridView({
  grid,
  today,
  checkIn,
  checkOut,
  blockedDates,
  onSelect,
  showPrevArrow,
  showNextArrow,
  onPrev,
  onNext,
}: {
  grid: MonthGridData;
  today: string;
  checkIn: string | null;
  checkOut: string | null;
  blockedDates: Set<string>;
  onSelect: (key: string) => void;
  showPrevArrow: boolean;
  showNextArrow: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  function cellClassName(key: string, disabled: boolean) {
    if (disabled) return "cursor-not-allowed text-slate-300 line-through";
    if (key === checkIn || key === checkOut) return "cursor-pointer rounded-full bg-[#153C4D] font-semibold text-white";
    if (checkIn && checkOut && key > checkIn && key < checkOut) return "cursor-pointer bg-slate-100 text-slate-700";
    return "cursor-pointer text-slate-600 hover:bg-slate-50 rounded-full";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        {showPrevArrow ? (
          <button type="button" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft size={16} className="text-slate-400 transition hover:text-[#153C4D]" />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <p className="text-sm font-semibold text-slate-700">{grid.label}</p>
        {showNextArrow ? (
          <button type="button" onClick={onNext} aria-label="Next month">
            <ChevronRight size={16} className="text-slate-400 transition hover:text-[#153C4D]" />
          </button>
        ) : (
          <span className="w-4" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-xs">
        {weekdayLabels.map((d, i) => (
          <span key={i} className="font-medium text-slate-400">
            {d}
          </span>
        ))}
        {grid.weeks.flat().map((cell, i) => {
          if (!cell) return <span key={i} />;
          const disabled = blockedDates.has(cell.key) || cell.key < today;
          return (
            <button
              type="button"
              key={cell.key}
              disabled={disabled}
              onClick={() => onSelect(cell.key)}
              className={`flex h-8 items-center justify-center text-sm ${cellClassName(cell.key, disabled)}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingCalendarView({ confirmationPath }: { confirmationPath: string }) {
  const {
    property,
    loading,
    error,
    blockedDates,
    step,
    checkIn,
    checkOut,
    guests,
    rooms,
    childrenUnder14,
    selectDay,
    setGuests,
    setRooms,
    setChildrenUnder14,
    goToDetails,
  } = usePropertyBooking();

  const [monthOffset, setMonthOffset] = useState(0);
  const today = todayKey();

  const base = useMemo(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [today]);

  const firstVisible = useMemo(() => {
    let cur = base;
    for (let i = 0; i < monthOffset; i++) cur = nextMonth(cur.year, cur.month);
    return cur;
  }, [base, monthOffset]);
  const secondVisible = nextMonth(firstVisible.year, firstVisible.month);

  const firstGrid = buildMonthGrid(firstVisible.year, firstVisible.month);
  const secondGrid = buildMonthGrid(secondVisible.year, secondVisible.month);

  const guestOptions = property ? guestCountOptions(property.pricingTiers) : [];
  const roomOptions = property ? roomOptionsForGuestCount(property.pricingTiers, guests) : [];

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const stay =
    property && checkIn && checkOut
      ? computeStayBreakdown(property.pricingTiers, checkIn, checkOut, guests, rooms, property, childrenUnder14)
      : null;
  const minNightsOk = !property || nights === 0 || nights >= property.minNights;
  const canReserve = Boolean(checkIn && checkOut && stay && minNightsOk);

  if (loading) {
    return (
      <section id="booking" className="bg-[#EAF6FB] px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-10 text-center text-slate-500 shadow-lg">
          Loading availability...
        </div>
      </section>
    );
  }

  if (error || !property) {
    return (
      <section id="booking" className="bg-[#EAF6FB] px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-10 text-center text-red-600 shadow-lg">
          {error ?? "Unable to load this property right now."}
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="bg-[#EAF6FB] px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-8 shadow-lg sm:p-10">
        {step === "select" && (
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr_300px]">
            <MonthGridView
              grid={firstGrid}
              today={today}
              checkIn={checkIn}
              checkOut={checkOut}
              blockedDates={blockedDates}
              onSelect={selectDay}
              showPrevArrow={monthOffset > 0}
              showNextArrow={false}
              onPrev={() => setMonthOffset((v) => Math.max(0, v - 1))}
              onNext={() => {}}
            />
            <MonthGridView
              grid={secondGrid}
              today={today}
              checkIn={checkIn}
              checkOut={checkOut}
              blockedDates={blockedDates}
              onSelect={selectDay}
              showPrevArrow={false}
              showNextArrow={monthOffset < MAX_MONTH_OFFSET}
              onPrev={() => {}}
              onNext={() => setMonthOffset((v) => Math.min(MAX_MONTH_OFFSET, v + 1))}
            />

            <div className="flex flex-col justify-center">
              {stay ? (
                <>
                  <p className="text-right text-2xl font-bold leading-tight text-[#153C4D] sm:text-[1.7rem]">
                    {formatMoney(stay.grandTotal, property.currency)}
                  </p>
                  <p className="mt-1 text-right text-sm font-medium text-[#153C4D]">
                    {stay.nights} night{stay.nights > 1 ? "s" : ""} · {formatMoney(stay.pricePerNight, property.currency)}
                    /night
                  </p>
                  {property.cityTaxEnabled && (
                    <div className="mt-2 text-right text-xs text-slate-500">
                      <p>Accommodation: {formatMoney(stay.accommodationPrice, property.currency)}</p>
                      <p>
                        City tax: {formatMoney(stay.cityTax, property.currency)}
                        {stay.cityTaxDetail && stay.cityTaxDetail.ratePerPersonPerNight !== null && (
                          <>
                            {" "}
                            ({stay.cityTaxDetail.taxableGuests} guest{stay.cityTaxDetail.taxableGuests === 1 ? "" : "s"} ×{" "}
                            {stay.cityTaxDetail.taxedNights} night{stay.cityTaxDetail.taxedNights === 1 ? "" : "s"} ×{" "}
                            {formatMoney(stay.cityTaxDetail.ratePerPersonPerNight, property.currency)}
                            {stay.nights > stay.cityTaxDetail.taxedNights && ", capped at 5 nights"})
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-right text-sm font-medium text-slate-400">
                  Select your dates to see the price
                </p>
              )}
              {checkIn && checkOut && !minNightsOk && (
                <p className="mt-1 text-right text-xs text-red-600">
                  Minimum stay is {property.minNights} night{property.minNights > 1 ? "s" : ""}
                </p>
              )}

              <div className="mt-6 overflow-hidden rounded-2xl shadow-md">
                <div className="grid grid-cols-2 divide-x divide-slate-100">
                  <div className="bg-white px-4 py-3">
                    <span className="block text-xs font-medium text-slate-400">Check-In</span>
                    <span className="mt-0.5 block text-sm font-semibold text-[#153C4D]">
                      {checkIn ? formatDisplayDate(checkIn) : "Select"}
                    </span>
                  </div>
                  <div className="bg-white px-4 py-3">
                    <span className="block text-xs font-medium text-slate-400">Check-Out</span>
                    <span className="mt-0.5 block text-sm font-semibold text-[#153C4D]">
                      {checkOut ? formatDisplayDate(checkOut) : "Select"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-white px-4 py-3">
                  <span className="block text-xs font-medium text-slate-400">Guests</span>
                  <div className="relative mt-0.5">
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full appearance-none bg-transparent text-sm font-semibold text-[#153C4D] outline-none"
                    >
                      {guestOptions.map((g) => (
                        <option key={g} value={g}>
                          {g} Guest{g > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1 shrink-0 text-slate-400" />
                  </div>
                </div>
                {roomOptions.length > 1 && (
                  <div className="border-t border-slate-100 bg-white px-4 py-3">
                    <span className="block text-xs font-medium text-slate-400">Rooms</span>
                    <div className="relative mt-0.5">
                      <select
                        value={rooms}
                        onChange={(e) => setRooms(Number(e.target.value))}
                        className="w-full appearance-none bg-transparent text-sm font-semibold text-[#153C4D] outline-none"
                      >
                        {roomOptions.map((r) => (
                          <option key={r} value={r}>
                            {r} Room{r > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1 shrink-0 text-slate-400" />
                    </div>
                  </div>
                )}
                {property.cityTaxEnabled && (
                  <div className="border-t border-slate-100 bg-white px-4 py-3">
                    <span className="block text-xs font-medium text-slate-400">
                      Children under {property.cityTaxExemptAgeUnder ?? 14} (no city tax)
                    </span>
                    <div className="relative mt-0.5">
                      <select
                        value={childrenUnder14}
                        onChange={(e) => setChildrenUnder14(Number(e.target.value))}
                        className="w-full appearance-none bg-transparent text-sm font-semibold text-[#153C4D] outline-none"
                      >
                        {Array.from({ length: guests + 1 }, (_, n) => n).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1 shrink-0 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!canReserve}
                onClick={goToDetails}
                className="mt-4 w-full rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reserve
              </button>
            </div>
          </div>
        )}

        {step === "details" && <GuestDetailsForm />}
        {step === "payment" && <PaymentStep confirmationPath={confirmationPath} />}
      </div>
    </section>
  );
}
