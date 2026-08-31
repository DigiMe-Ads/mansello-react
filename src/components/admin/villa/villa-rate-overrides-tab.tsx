"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT } from "@/components/admin/input-styles";
import { createRateOverride, deleteRateOverride, getRateOverrides } from "@/lib/api/rate-overrides";
import { usesRoomModel } from "@/lib/api/rooms";
import { formatDisplayDate } from "@/lib/date";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property, RateOverride, Room } from "@/lib/api/types";

// Admin-defined "charge X/night for this date range instead of the base
// rate" — layered on top of the Rooms tab's per-room rate (Sri Lanka) or the
// Pricing tab's guests×rooms tiers (Italy), whichever this property uses.
// Guests never see a calendar of these — only the resolved price for the
// dates they actually pick (see lib/api/pricing.ts).
export function VillaRateOverridesTab({
  property,
  rooms,
}: {
  property: Property;
  rooms: Room[];
}) {
  const { authedFetch } = useAdminAuth();
  const [overrides, setOverrides] = useState<RateOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasRooms = usesRoomModel(property, rooms);

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

  async function remove(id: string) {
    try {
      await deleteRateOverride(authedFetch, property.id, id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete override");
    }
  }

  function labelFor(o: RateOverride): string {
    if (o.roomId) return rooms.find((r) => r.id === o.roomId)?.name ?? "Unknown room";
    return `${o.guestCount} guest${o.guestCount === 1 ? "" : "s"} / ${o.rooms} room${o.rooms === 1 ? "" : "s"}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Set a different nightly price for a specific date or date range — e.g. peak-season rates. The base
        price from the {hasRooms ? "Rooms" : "Pricing"} tab still applies to every date not covered here.
        Guests only ever see the resolved price for the dates they pick, never this list.
      </p>

      <NewOverrideForm property={property} rooms={rooms} onCreated={load} />

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
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
                  <td className="border-t border-slate-100 px-4 py-3 font-semibold text-[#153C4D]">{labelFor(o)}</td>
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

function NewOverrideForm({
  property,
  rooms,
  onCreated,
}: {
  property: Property;
  rooms: Room[];
  onCreated: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const hasRooms = usesRoomModel(property, rooms);
  const tierOptions = property.pricingTiers;

  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [tierKey, setTierKey] = useState(tierOptions[0] ? `${tierOptions[0].guestCount}:${tierOptions[0].rooms}` : "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const [guestCount, roomsCount] = tierKey.split(":").map(Number);
      await createRateOverride(authedFetch, property.id, {
        roomId: hasRooms ? roomId : undefined,
        guestCount: hasRooms ? undefined : guestCount,
        rooms: hasRooms ? undefined : roomsCount,
        startDate,
        endDate,
        pricePerNight: Number(pricePerNight),
      });
      setStartDate("");
      setEndDate("");
      setPricePerNight("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save seasonal pricing");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = (hasRooms ? Boolean(roomId) : Boolean(tierKey)) && startDate && endDate && pricePerNight;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Add Seasonal Price</h3>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {hasRooms ? (
        rooms.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">Add a room on the Rooms tab first.</p>
        ) : (
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={`${ADMIN_SELECT} mt-4`}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )
      ) : tierOptions.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">Add a pricing tier on the Pricing tab first.</p>
      ) : (
        <select value={tierKey} onChange={(e) => setTierKey(e.target.value)} className={`${ADMIN_SELECT} mt-4`}>
          {tierOptions.map((t) => (
            <option key={`${t.guestCount}:${t.rooms}`} value={`${t.guestCount}:${t.rooms}`}>
              {t.guestCount} guest{t.guestCount === 1 ? "" : "s"} / {t.rooms} room{t.rooms === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          required
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          required
          type="number"
          min={0}
          step="0.01"
          placeholder={`Price / night (${property.currency.toUpperCase()})`}
          value={pricePerNight}
          onChange={(e) => setPricePerNight(e.target.value)}
          className={ADMIN_INPUT}
        />
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Add"}
        </button>
      </div>
    </form>
  );
}
