"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { usePropertyBooking } from "./booking-provider";
import { GuestDetailsForm } from "./guest-details-form";
import { buildMonthGrid, formatDisplayDate, nextMonth, todayKey, type MonthGridData } from "@/lib/date";
import {
  childrenOptionsForAdults,
  computeRoomsStayBreakdown,
  computeStayBreakdown,
  guestCountOptions,
  nightsBetween,
  roomOptionsForGuestCount,
  totalRoomCapacity,
} from "@/lib/api/pricing";
import { formatMoney } from "@/lib/currency";
import { isRangeAvailable } from "@/lib/availability";
import { isRenderableImageSrc } from "@/lib/image";

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

export function BookingCalendarView({
  confirmationPath,
  guestFieldsMode = "guests",
  showTransport = true,
}: {
  confirmationPath: string;
  // "adults" splits the headcount picker into separate Adults + Children
  // selects (children implied by the count, no extra step) instead of a
  // single Guests total followed by a "how many of those are kids" select.
  guestFieldsMode?: "guests" | "adults";
  showTransport?: boolean;
}) {
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
    selectedRoomIds,
    roomBlockedDates,
    offers,
    selectDay,
    setGuests,
    setRooms,
    setChildrenUnder14,
    setGuestComposition,
    toggleRoom,
    goToDetails,
    transportPrice,
    wantsTransport,
    setWantsTransport,
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

  // Properties with individually-bookable rooms (e.g. Dona's Villa) price
  // and pick differently from single-unit properties (The Nest Bologna):
  // guest capacity comes from summing room capacities, price from summing
  // the selected rooms' own rates, and the guest picks specific rooms
  // instead of just a room *count*.
  const hasRooms = Boolean(property?.rooms?.length);
  const guestOptions = property
    ? hasRooms
      ? Array.from({ length: totalRoomCapacity(property.rooms!) }, (_, i) => i + 1)
      : guestCountOptions(property.pricingTiers)
    : [];
  const roomOptions = property ? roomOptionsForGuestCount(property.pricingTiers, guests) : [];

  // Only meaningful in "adults" mode: total guests split into the two
  // independently-picked counts, each always landing on a real pricing tier.
  const adults = guests - childrenUnder14;
  const adultsOptions = guestOptions;
  const childrenOptions = property ? childrenOptionsForAdults(property.pricingTiers, adults) : [];

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const rateOverrides = property?.rateOverrides ?? [];
  // Only charge for a transfer the guest actually ticked, and only when this
  // property has a rate for their party size.
  const appliedTransportPrice = wantsTransport && transportPrice != null ? transportPrice : 0;

  const stay =
    property && checkIn && checkOut
      ? hasRooms
        ? computeRoomsStayBreakdown(
            property.rooms!,
            selectedRoomIds,
            checkIn,
            checkOut,
            guests,
            property,
            childrenUnder14,
            rateOverrides,
            offers,
            appliedTransportPrice
          )
        : computeStayBreakdown(
            property.pricingTiers,
            checkIn,
            checkOut,
            guests,
            rooms,
            property,
            childrenUnder14,
            rateOverrides,
            offers,
            appliedTransportPrice
          )
      : null;
  const minNightsOk = !property || nights === 0 || nights >= property.minNights;

  const selectedCapacity = hasRooms
    ? (property?.rooms ?? []).filter((r) => selectedRoomIds.includes(r.id)).reduce((sum, r) => sum + r.capacity, 0)
    : 0;
  const selectedRoomsAvailable =
    !checkIn || !checkOut || selectedRoomIds.every((id) => isRangeAvailable(roomBlockedDates.get(id) ?? new Set(), checkIn, checkOut));
  const roomsValid = !hasRooms || (selectedRoomIds.length > 0 && selectedCapacity >= guests && selectedRoomsAvailable);

  const canReserve = Boolean(checkIn && checkOut && stay && minNightsOk && roomsValid);

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
                  {stay.discountAmount > 0 && (
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-sm font-medium text-slate-400 line-through">
                        {formatMoney(stay.grandTotal + stay.discountAmount, property.currency)}
                      </p>
                      {stay.discountPercentApplied !== undefined && (
                        <span className="rounded-full bg-[#F5A623] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {stay.discountPercentApplied}% OFF
                        </span>
                      )}
                    </div>
                  )}
                  <p
                    className={`text-right text-2xl font-bold leading-tight sm:text-[1.7rem] ${
                      stay.discountAmount > 0 ? "text-[#F5A623]" : "text-[#153C4D]"
                    }`}
                  >
                    {formatMoney(stay.grandTotal, property.currency)}
                  </p>
                  <p className="mt-1 text-right text-sm font-medium text-[#153C4D]">
                    {stay.nights} night{stay.nights > 1 ? "s" : ""} · {formatMoney(stay.pricePerNight, property.currency)}
                    /night
                  </p>
                  {/* Itemised here too, so the headline total above is never
                      an unexplained jump when the add-on is ticked. */}
                  {stay.transportPrice > 0 && (
                    <p className="mt-1 text-right text-xs text-slate-500">
                      Includes airport transfer: {formatMoney(stay.transportPrice, property.currency)}
                    </p>
                  )}
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
                {guestFieldsMode === "adults" ? (
                  <>
                    <div className="border-t border-slate-100 bg-white px-4 py-3">
                      <span className="block text-xs font-medium text-slate-400">Adults</span>
                      <div className="relative mt-0.5">
                        <select
                          value={adults}
                          onChange={(e) => {
                            const nextAdults = Number(e.target.value);
                            const validChildren = property
                              ? childrenOptionsForAdults(property.pricingTiers, nextAdults)
                              : [];
                            const nextChildren = validChildren.includes(childrenUnder14)
                              ? childrenUnder14
                              : 0;
                            setGuestComposition(nextAdults, nextChildren);
                          }}
                          className="w-full appearance-none bg-transparent text-sm font-semibold text-[#153C4D] outline-none"
                        >
                          {adultsOptions.map((a) => (
                            <option key={a} value={a}>
                              {a} Adult{a > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1 shrink-0 text-slate-400" />
                      </div>
                    </div>
                    <div className="border-t border-slate-100 bg-white px-4 py-3">
                      <span className="block text-xs font-medium text-slate-400">
                        Children
                        {property.cityTaxEnabled &&
                          ` (under ${property.cityTaxExemptAgeUnder ?? 14}, no city tax)`}
                      </span>
                      <div className="relative mt-0.5">
                        <select
                          value={childrenUnder14}
                          onChange={(e) => setGuestComposition(adults, Number(e.target.value))}
                          className="w-full appearance-none bg-transparent text-sm font-semibold text-[#153C4D] outline-none"
                        >
                          {childrenOptions.map((c) => (
                            <option key={c} value={c}>
                              {c} Child{c === 1 ? "" : "ren"}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-0 top-1 shrink-0 text-slate-400" />
                      </div>
                    </div>
                  </>
                ) : (
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
                )}
                {!hasRooms && roomOptions.length > 1 && (
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
                {property.cityTaxEnabled && guestFieldsMode !== "adults" && (
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

              {hasRooms && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-400">
                    Choose Room{selectedRoomIds.length > 1 ? "s" : ""} ({selectedCapacity}/{guests} guests covered)
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {property.rooms!.map((room) => {
                      const blocked =
                        checkIn && checkOut
                          ? !isRangeAvailable(roomBlockedDates.get(room.id) ?? new Set(), checkIn, checkOut)
                          : false;
                      const selected = selectedRoomIds.includes(room.id);
                      const thumb = room.images[0];
                      return (
                        <button
                          type="button"
                          key={room.id}
                          disabled={blocked}
                          onClick={() => toggleRoom(room.id)}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            blocked
                              ? "cursor-not-allowed border-slate-100 opacity-50"
                              : selected
                                ? "border-[#8DC63F] bg-[#8DC63F]/5"
                                : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {thumb && isRenderableImageSrc(thumb) && (
                              <Image src={thumb} alt={room.name} fill sizes="56px" className="object-cover" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#153C4D]">{room.name}</p>
                            <p className="text-xs text-slate-500">
                              {room.subtitle} · Sleeps {room.capacity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#153C4D]">
                              {formatMoney(Number(room.pricePerNight), property.currency)}
                            </p>
                            <p className="text-[10px] text-slate-400">/night</p>
                            {blocked && <p className="text-[10px] font-semibold text-red-500">Booked</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedRoomIds.length > 0 && selectedCapacity < guests && (
                    <p className="mt-2 text-xs text-red-600">
                      Selected room{selectedRoomIds.length > 1 ? "s" : ""} sleep{selectedRoomIds.length === 1 ? "s" : ""} only{" "}
                      {selectedCapacity} — pick enough rooms for {guests} guests.
                    </p>
                  )}
                </div>
              )}

              {/* Airport transfer, priced up front. This used to be buried in
                  the guest-details step, so the first time anyone saw the cost
                  was at payment. */}
              {transportPrice !== null && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-400">Add-ons</p>
                  <button
                    type="button"
                    onClick={() => setWantsTransport(!wantsTransport)}
                    aria-pressed={wantsTransport}
                    className={`mt-2 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      wantsTransport
                        ? "border-[#8DC63F] bg-[#8DC63F]/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        wantsTransport ? "border-[#8DC63F] bg-[#8DC63F] text-white" : "border-slate-300"
                      }`}
                      aria-hidden="true"
                    >
                      {wantsTransport && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-[#153C4D]">Airport transfer</span>
                      <span className="block text-xs text-slate-500">
                        Private pick-up for {guests} guest{guests === 1 ? "" : "s"} · one-off charge
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold text-[#153C4D]">
                        {formatMoney(transportPrice, property.currency)}
                      </span>
                      <span className="block text-[10px] text-slate-400">total</span>
                    </span>
                  </button>
                </div>
              )}

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

        {step === "details" && <GuestDetailsForm showTransport={showTransport} />}
        {step === "payment" && <PaymentStep confirmationPath={confirmationPath} />}
      </div>
    </section>
  );
}
