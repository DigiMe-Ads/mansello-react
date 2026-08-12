"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import { deletePricingTier, updatePricingTiers } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property } from "@/lib/api/types";

interface TierRow {
  id?: string; // present for tiers that already exist on the backend
  guestCount: number;
  rooms: number;
  pricePerNight: number;
}

// Parent must pass `key={property.updatedAt}` so this remounts (resetting
// `rows` from the lazy initializer) whenever a save/delete produces fresh
// tiers, instead of syncing local edit state to prop changes via an effect.
export function VillaPricingTab({ property, onUpdated }: { property: Property; onUpdated: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [rows, setRows] = useState<TierRow[]>(() =>
    property.pricingTiers.map((t) => ({
      id: t.id,
      guestCount: t.guestCount,
      rooms: t.rooms,
      pricePerNight: Number(t.pricePerNight),
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateRow(index: number, patch: Partial<TierRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setSuccess(false);
  }

  async function removeRow(index: number) {
    const row = rows[index];
    if (!row.id) {
      setRows((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setDeletingId(row.id);
    setError(null);
    try {
      await deletePricingTier(authedFetch, property.id, row.id);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete tier");
    } finally {
      setDeletingId(null);
    }
  }

  function addRow() {
    setRows((prev) => [...prev, { guestCount: 1, rooms: 1, pricePerNight: 0 }]);
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await updatePricingTiers(
        authedFetch,
        property.id,
        rows.map(({ guestCount, rooms, pricePerNight }) => ({ guestCount, rooms, pricePerNight }))
      );
      setSuccess(true);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save pricing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Pricing Tiers</h3>
      <p className="mt-1 text-xs text-slate-400">
        Price per night for each guest count / room combination. New rows are created on save; removing an existing
        row deletes it immediately.
      </p>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Pricing saved.</p>}

      <div className="mt-4 flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Guests</span>
          <span>Rooms</span>
          <span>Price / Night ({property.currency.toUpperCase()})</span>
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={row.id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3">
            <input
              type="number"
              min={1}
              value={row.guestCount}
              onChange={(e) => updateRow(i, { guestCount: Number(e.target.value) })}
              className={ADMIN_INPUT}
            />
            <input
              type="number"
              min={1}
              value={row.rooms}
              onChange={(e) => updateRow(i, { rooms: Number(e.target.value) })}
              className={ADMIN_INPUT}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={row.pricePerNight}
              onChange={(e) => updateRow(i, { pricePerNight: Number(e.target.value) })}
              className={ADMIN_INPUT}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={deletingId === row.id}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
            >
              {deletingId === row.id ? "Removing..." : "Remove"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          + Add Tier
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Pricing"}
        </button>
      </div>
    </div>
  );
}
