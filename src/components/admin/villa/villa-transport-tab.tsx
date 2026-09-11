"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import { getTransportRates, updateTransportRates } from "@/lib/api/transport-rates";
import { updateProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property } from "@/lib/api/types";

// Airport-transfer pricing, quoted per party size (1-8 guests) rather than
// per person, because a transfer for four people is one vehicle rather than
// four fares. Guests see this as an optional tick-box during booking; the
// server prices it from this table by their guest count.
// See BACKEND_CHANGES_VILLA_TRANSPORT.md.

const MAX_GUESTS = 8;

type Row = { guestCount: number; price: number; active: boolean };

const DEFAULT_ROWS: Row[] = Array.from({ length: MAX_GUESTS }, (_, i) => ({
  guestCount: i + 1,
  price: 0,
  active: false,
}));

export function VillaTransportTab({ property, onUpdated }: { property: Property; onUpdated?: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Master on/off switch — separate from the per-party-size rows below.
  // Turning this off pulls the whole add-on from guests immediately,
  // whatever the rows say. Saved on its own so flipping it doesn't require
  // re-submitting the price table.
  const [transportEnabled, setTransportEnabled] = useState(property.transportEnabled !== false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTransportRates(property.id)
      .then((rates) => {
        if (cancelled || rates.length === 0) return;
        // Merge onto the fixed 1-8 skeleton so a partially-configured table
        // still renders every guest count.
        setRows(
          DEFAULT_ROWS.map((base) => {
            const match = rates.find((r) => r.guestCount === base.guestCount);
            return match ? { guestCount: base.guestCount, price: Number(match.price), active: match.active } : base;
          })
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_VILLA_TRANSPORT.md is implemented. You can still fill the table in; saving will work once it ships."
            : null // any other failure just keeps the editable defaults
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [property.id]);

  function update(guestCount: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.guestCount === guestCount ? { ...r, ...patch } : r)));
    setSuccess(false);
  }

  async function handleToggleEnabled() {
    const next = !transportEnabled;
    setTransportEnabled(next); // optimistic — flip back below on failure
    setTogglingEnabled(true);
    setToggleError(null);
    try {
      await updateProperty(authedFetch, property.id, { transportEnabled: next });
      onUpdated?.();
    } catch (err) {
      setTransportEnabled(!next);
      setToggleError(err instanceof ApiRequestError ? err.message : "Failed to update transport availability");
    } finally {
      setTogglingEnabled(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateTransportRates(authedFetch, property.id, rows);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save transport prices");
    } finally {
      setSaving(false);
    }
  }

  const currency = property.currency.toUpperCase();
  const activeCount = rows.filter((r) => r.active && r.price > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Airport transfer pricing for this property. Guests see this as an optional add-on while booking — if
        they tick it, the price for their party size is added once to their total (not per night).
      </p>

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Transport prices saved.</p>
      )}

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">
            Offer Airport Transfers to Guests
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Master switch for this property. Off hides the airport-transfer option from guests during booking
            entirely, regardless of the prices configured below.
          </p>
          {toggleError && <p className="mt-2 text-xs font-semibold text-red-600">{toggleError}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={transportEnabled}
          aria-label={`Airport transfers are ${transportEnabled ? "on" : "off"} for ${property.name}`}
          onClick={handleToggleEnabled}
          disabled={togglingEnabled}
          className={`relative h-7 w-14 shrink-0 rounded-full transition disabled:opacity-60 ${
            transportEnabled ? "bg-[#8DC63F]" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
              transportEnabled ? "left-8" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">
          Airport Transfer Price by Party Size
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Enter the <strong>total</strong> price for the whole party, not per person — a transfer for 4 guests
          is one vehicle. Untick a row to stop offering transfers for that party size; unticked rows and rows
          priced 0 are not shown to guests.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Number of guests</th>
                  <th className="px-4 py-3">Transfer price ({currency})</th>
                  <th className="px-4 py-3">Offered to guests</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.guestCount} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-semibold text-[#153C4D]">
                      {row.guestCount} guest{row.guestCount === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.price}
                        onChange={(e) => update(row.guestCount, { price: Number(e.target.value) })}
                        aria-label={`Airport transfer price in ${currency} for ${row.guestCount} guests`}
                        className={`${ADMIN_INPUT} w-40`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={(e) => update(row.guestCount, { active: e.target.checked })}
                          aria-label={`Offer airport transfers for ${row.guestCount} guests`}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {row.active ? "Offered" : "Not offered"}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Transport Prices"}
          </button>
          <span className="text-xs text-slate-400">
            {activeCount === 0
              ? "No party sizes offered yet — guests won't see the transfer option."
              : `Offered for ${activeCount} party size${activeCount === 1 ? "" : "s"}.`}
          </span>
        </div>
      </div>
    </div>
  );
}
