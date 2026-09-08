"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT } from "@/components/admin/input-styles";
import { PriceCalendar, type DateRange } from "@/components/admin/villa/price-calendar";
import { createRateOverride, deleteRateOverride, getRateOverrides } from "@/lib/api/rate-overrides";
import { usesRoomModel } from "@/lib/api/rooms";
import { resolveNightlyPriceForRoom, resolveNightlyPriceForTier } from "@/lib/api/pricing";
import { formatDisplayDate } from "@/lib/date";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property, RateOverride, Room } from "@/lib/api/types";

// Admin-defined "charge X/night for this date range instead of the base
// rate" — layered on top of the Rooms tab's per-room rate (Sri Lanka) or the
// Pricing tab's guests×rooms tiers (Italy), whichever this property uses.
// Guests never see a calendar of these — only the resolved price for the
// dates they actually pick (see lib/api/pricing.ts).

/** Identifies which room, or which guests×rooms tier, a price applies to. */
type Target = { kind: "room"; roomId: string } | { kind: "tier"; guestCount: number; rooms: number };

function targetKey(t: Target): string {
  return t.kind === "room" ? `room:${t.roomId}` : `tier:${t.guestCount}:${t.rooms}`;
}

export function VillaRateOverridesTab({ property, rooms }: { property: Property; rooms: Room[] }) {
  const { authedFetch } = useAdminAuth();
  const [overrides, setOverrides] = useState<RateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasRooms = usesRoomModel(property, rooms);
  const tiers = property.pricingTiers;

  // Which room / tier the calendar is currently showing and editing.
  const [target, setTarget] = useState<Target | null>(null);
  useEffect(() => {
    if (target) return;
    if (hasRooms && rooms[0]) setTarget({ kind: "room", roomId: rooms[0].id });
    else if (!hasRooms && tiers[0])
      setTarget({ kind: "tier", guestCount: tiers[0].guestCount, rooms: tiers[0].rooms });
  }, [hasRooms, rooms, tiers, target]);

  const [selection, setSelection] = useState<DateRange | null>(null);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getRateOverrides(property.id)
      .then((result) => setOverrides(result.sort((a, b) => a.startDate.localeCompare(b.startDate))))
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load seasonal pricing"
        )
      )
      .finally(() => setLoading(false));
  }, [property.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Only the overrides belonging to the room/tier currently on screen — the
  // calendar would be meaningless if it mixed prices for different rooms.
  const targetOverrides = useMemo(() => {
    if (!target) return [];
    return overrides.filter((o) =>
      target.kind === "room"
        ? o.roomId === target.roomId
        : o.guestCount === target.guestCount && o.rooms === target.rooms
    );
  }, [overrides, target]);

  const selectedRoom = target?.kind === "room" ? rooms.find((r) => r.id === target.roomId) : undefined;
  const selectedTier =
    target?.kind === "tier"
      ? tiers.find((t) => t.guestCount === target.guestCount && t.rooms === target.rooms)
      : undefined;

  /** Nightly price on a date — the seasonal override if one covers it, else the base rate. */
  const priceFor = useCallback(
    (dateKey: string): number | null => {
      if (selectedRoom) return resolveNightlyPriceForRoom(selectedRoom, targetOverrides, dateKey);
      if (selectedTier) return resolveNightlyPriceForTier(selectedTier, targetOverrides, dateKey);
      return null;
    },
    [selectedRoom, selectedTier, targetOverrides]
  );

  const isOverridden = useCallback(
    (dateKey: string) =>
      targetOverrides.some((o) => dateKey >= o.startDate.slice(0, 10) && dateKey <= o.endDate.slice(0, 10)),
    [targetOverrides]
  );

  const basePrice = selectedRoom
    ? Number(selectedRoom.pricePerNight)
    : selectedTier
      ? Number(selectedTier.pricePerNight)
      : null;

  async function handleSave() {
    if (!target || !selection || !price) return;
    setSaving(true);
    setError(null);
    try {
      await createRateOverride(authedFetch, property.id, {
        roomId: target.kind === "room" ? target.roomId : undefined,
        guestCount: target.kind === "tier" ? target.guestCount : undefined,
        rooms: target.kind === "tier" ? target.rooms : undefined,
        startDate: selection.start,
        endDate: selection.end,
        pricePerNight: Number(price),
      });
      setSelection(null);
      setPrice("");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save seasonal pricing");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await deleteRateOverride(authedFetch, property.id, id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete seasonal price");
    }
  }

  function labelFor(o: RateOverride): string {
    if (o.roomId) return rooms.find((r) => r.id === o.roomId)?.name ?? "Unknown room";
    return `${o.guestCount} guest${o.guestCount === 1 ? "" : "s"} / ${o.rooms} room${o.rooms === 1 ? "" : "s"}`;
  }

  const nights = selection
    ? Math.round(
        (Date.parse(`${selection.end}T00:00:00Z`) - Date.parse(`${selection.start}T00:00:00Z`)) / 86400000
      ) + 1
    : 0;

  const noTargets = hasRooms ? rooms.length === 0 : tiers.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Set a different nightly price for specific dates — e.g. peak-season rates. Every date not covered here
        uses the base price from the {hasRooms ? "Rooms" : "Pricing"} tab. Guests only ever see the resolved
        price for the dates they pick, never this list.
      </p>

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}

      {noTargets ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-slate-400 shadow-sm">
          Add {hasRooms ? "a room on the Rooms tab" : "a pricing tier on the Pricing tab"} first — seasonal
          prices attach to one of those.
        </p>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Set a Seasonal Price</h3>

            <label className="mt-4 flex max-w-md flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {hasRooms ? "Which room does this price apply to?" : "Which guests / rooms tier?"}
              <select
                value={target ? targetKey(target) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelection(null);
                  if (v.startsWith("room:")) setTarget({ kind: "room", roomId: v.slice(5) });
                  else {
                    const [, g, r] = v.split(":");
                    setTarget({ kind: "tier", guestCount: Number(g), rooms: Number(r) });
                  }
                }}
                className={`${ADMIN_SELECT} font-normal normal-case`}
              >
                {hasRooms
                  ? rooms.map((r) => (
                      <option key={r.id} value={`room:${r.id}`}>
                        {r.name} — base {property.currency.toUpperCase()} {r.pricePerNight}/night
                      </option>
                    ))
                  : tiers.map((t) => (
                      <option key={`${t.guestCount}:${t.rooms}`} value={`tier:${t.guestCount}:${t.rooms}`}>
                        {t.guestCount} guest{t.guestCount === 1 ? "" : "s"} / {t.rooms} room
                        {t.rooms === 1 ? "" : "s"} — base {property.currency.toUpperCase()} {t.pricePerNight}
                        /night
                      </option>
                    ))}
              </select>
            </label>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Select the dates
            </p>
            <p className="mb-3 text-xs text-slate-400">
              Click a single date, or click and drag across several to select a range. Each date shows the
              nightly price it currently charges.
            </p>

            <PriceCalendar
              monthCount={2}
              selectable
              selection={selection}
              onSelectionChange={setSelection}
              priceFor={priceFor}
              isOverridden={isOverridden}
              currency={property.currency}
            />

            <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-slate-100 pt-5">
              <div className="text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected dates</p>
                <p className="mt-1 text-slate-700">
                  {selection ? (
                    <>
                      {formatDisplayDate(selection.start)}
                      {selection.start !== selection.end && <> → {formatDisplayDate(selection.end)}</>}{" "}
                      <span className="text-slate-400">
                        ({nights} night{nights === 1 ? "" : "s"})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">None yet — pick dates above</span>
                  )}
                </p>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                New nightly price ({property.currency.toUpperCase()})
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={basePrice != null ? `Base is ${basePrice}` : ""}
                  className={`${ADMIN_INPUT} font-normal normal-case`}
                />
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selection || !price}
                className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Apply to selected dates"}
              </button>

              {selection && (
                <button
                  type="button"
                  onClick={() => setSelection(null)}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>

          {/* Year-wide read-only view: the whole pricing calendar at a glance,
              so a gap or a wrong season is obvious without clicking through. */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">
              Full Year — {selectedRoom?.name ?? (selectedTier ? `${selectedTier.guestCount} guests / ${selectedTier.rooms} rooms` : "")}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border border-slate-200 bg-white" />
                Base price {basePrice != null && `(${property.currency.toUpperCase()} ${basePrice})`}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border border-[#8DC63F] bg-[#8DC63F]/15" />
                Seasonal price
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded ring-1 ring-inset ring-[#F5A623]" />
                Today
              </span>
            </div>

            <div className="mt-5">
              <PriceCalendar
                monthCount={12}
                priceFor={priceFor}
                isOverridden={isOverridden}
                currency={property.currency}
              />
            </div>
          </div>
        </>
      )}

      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">{hasRooms ? "Room" : "Guests / Rooms"}</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Price / Night ({property.currency.toUpperCase()})</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {overrides.length === 0 && (
                <tr>
                  <td colSpan={4} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    No seasonal pricing set — every date uses the base price.
                  </td>
                </tr>
              )}
              {overrides.map((o) => (
                <tr key={o.id}>
                  <td className="border-t border-slate-100 px-4 py-3 font-semibold text-[#153C4D]">
                    {labelFor(o)}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                    {formatDisplayDate(o.startDate.slice(0, 10))} → {formatDisplayDate(o.endDate.slice(0, 10))}
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{o.pricePerNight}</td>
                  <td className="border-t border-slate-100 px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(o.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
