"use client";

import { useEffect, useRef, useState } from "react";
import { buildMonthGrid, nextMonth, prevMonth, todayKey } from "@/lib/date";

export interface DateRange {
  start: string;
  end: string;
}

/** Puts a range the right way round however the admin dragged it. */
export function normalizeRange(a: string, b: string): DateRange {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

function inRange(key: string, range: DateRange | null): boolean {
  return !!range && key >= range.start && key <= range.end;
}

interface PriceCalendarProps {
  /** How many months to render side by side. */
  monthCount?: number;
  /** First month shown. Defaults to the current month. */
  initialYear?: number;
  initialMonth?: number;
  /** Nightly price for a date, or null if it can't be resolved yet. */
  priceFor?: (dateKey: string) => number | null;
  /** True when this date's price comes from a seasonal override, not the base rate. */
  isOverridden?: (dateKey: string) => boolean;
  /** Currency code for display, e.g. "eur". */
  currency?: string;
  /** Drag-to-select. When false the calendar is a read-only price view. */
  selectable?: boolean;
  selection?: DateRange | null;
  onSelectionChange?: (range: DateRange) => void;
  /** Show month navigation arrows. */
  navigable?: boolean;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function formatPrice(value: number, currency: string): string {
  // Compact on purpose: these sit inside a ~40px calendar cell, so a full
  // Intl currency string ("€1,250.00") would wrap and break the grid.
  const rounded = Math.round(value);
  const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toLowerCase() === "usd" ? "$" : "";
  return rounded >= 1000 ? `${symbol}${(rounded / 1000).toFixed(1)}k` : `${symbol}${rounded}`;
}

/**
 * Month-grid calendar that shows the nightly price on every date and, when
 * `selectable`, lets the admin drag across days to pick a range.
 *
 * Replaces a pair of `<input type="date">` boxes: picking "the last two weeks
 * of August" by dragging is both faster and far less error-prone than typing
 * two ISO dates, and seeing each date's current price while choosing is the
 * whole point — otherwise you're setting seasonal rates blind.
 */
export function PriceCalendar({
  monthCount = 2,
  initialYear,
  initialMonth,
  priceFor,
  isOverridden,
  currency = "",
  selectable = false,
  selection = null,
  onSelectionChange,
  navigable = true,
}: PriceCalendarProps) {
  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return {
      year: initialYear ?? now.getUTCFullYear(),
      month: initialMonth ?? now.getUTCMonth(),
    };
  });

  // Anchor is the day the drag started; the live range runs anchor -> hovered.
  const anchorRef = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // A drag can end anywhere — outside the grid, outside the window — so the
  // release has to be caught globally or the calendar stays stuck in
  // drag mode and every subsequent hover rewrites the selection.
  useEffect(() => {
    if (!dragging) return;
    const stop = () => {
      setDragging(false);
      anchorRef.current = null;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [dragging]);

  function startAt(key: string) {
    if (!selectable) return;
    anchorRef.current = key;
    setDragging(true);
    onSelectionChange?.({ start: key, end: key });
  }

  function extendTo(key: string) {
    if (!selectable || !dragging || !anchorRef.current) return;
    onSelectionChange?.(normalizeRange(anchorRef.current, key));
  }

  const months = [];
  let m = cursor;
  for (let i = 0; i < monthCount; i++) {
    months.push(buildMonthGrid(m.year, m.month));
    m = nextMonth(m.year, m.month);
  }

  return (
    <div>
      {navigable && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor(prevMonth(cursor.year, cursor.month))}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => setCursor(nextMonth(cursor.year, cursor.month))}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Next →
          </button>
        </div>
      )}

      <div className={`grid gap-6 ${monthCount > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
        {months.map((grid) => (
          <div key={`${grid.year}-${grid.month}`}>
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-[#153C4D]">
              {grid.label}
            </p>
            <div className="grid grid-cols-7 gap-px">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="pb-1 text-center text-[10px] font-semibold text-slate-400">
                  {d}
                </div>
              ))}
              {grid.weeks.flat().map((cell, i) => {
                if (!cell) return <div key={`empty-${i}`} />;

                const price = priceFor?.(cell.key) ?? null;
                const overridden = isOverridden?.(cell.key) ?? false;
                const selected = inRange(cell.key, selection);
                const isToday = cell.key === today;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={!selectable}
                    onPointerDown={(e) => {
                      // Stop the browser turning the drag into a text
                      // selection or a scroll gesture.
                      e.preventDefault();
                      startAt(cell.key);
                    }}
                    onPointerEnter={() => extendTo(cell.key)}
                    aria-pressed={selectable ? selected : undefined}
                    aria-label={`${cell.key}${price != null ? `, ${formatPrice(price, currency)} per night` : ""}${
                      overridden ? ", seasonal price" : ""
                    }`}
                    className={[
                      "flex min-h-[44px] flex-col items-center justify-center rounded-md border text-[11px] leading-tight transition",
                      selectable ? "cursor-pointer touch-none" : "cursor-default",
                      selected
                        ? "border-[#153C4D] bg-[#153C4D] text-white"
                        : overridden
                          ? "border-[#8DC63F] bg-[#8DC63F]/15 text-[#153C4D]"
                          : "border-slate-200 bg-white text-slate-600",
                      !selected && selectable ? "hover:border-[#153C4D]" : "",
                      isToday && !selected ? "ring-1 ring-inset ring-[#F5A623]" : "",
                    ].join(" ")}
                  >
                    <span className="font-semibold">{cell.day}</span>
                    {price != null && (
                      <span className={selected ? "text-white/80" : "text-slate-400"}>
                        {formatPrice(price, currency)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
