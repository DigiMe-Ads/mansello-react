"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import { updateProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property } from "@/lib/api/types";

export function VillaSettingsTab({ property, onUpdated }: { property: Property; onUpdated: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [minNights, setMinNights] = useState(property.minNights);
  const [turnoverBufferDays, setTurnoverBufferDays] = useState(property.turnoverBufferDays);
  const [checkInTime, setCheckInTime] = useState(property.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(property.checkOutTime);
  const [icalUrls, setIcalUrls] = useState(property.airbnbIcalImportUrls.join("\n"));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL}/ical/${property.icalExportToken}.ics`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProperty(authedFetch, property.id, {
        minNights,
        turnoverBufferDays,
        checkInTime,
        checkOutTime,
        airbnbIcalImportUrls: icalUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
      });
      setSuccess(true);
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save settings");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Property Settings</h3>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Settings saved.</p>}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Min Nights
            <input
              type="number"
              min={1}
              value={minNights}
              onChange={(e) => setMinNights(Number(e.target.value))}
              className={`${ADMIN_INPUT} font-normal normal-case`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Turnover Buffer (days)
            <input
              type="number"
              min={0}
              value={turnoverBufferDays}
              onChange={(e) => setTurnoverBufferDays(Number(e.target.value))}
              className={`${ADMIN_INPUT} font-normal normal-case`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Check-in Time
            <input
              type="text"
              placeholder="15:00"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className={`${ADMIN_INPUT} font-normal normal-case`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Check-out Time
            <input
              type="text"
              placeholder="11:00"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className={`${ADMIN_INPUT} font-normal normal-case`}
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Airbnb Import URLs (one per line)
          <textarea
            rows={3}
            value={icalUrls}
            onChange={(e) => setIcalUrls(e.target.value)}
            className={`${ADMIN_TEXTAREA} font-normal normal-case`}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Our Export Feed</h3>
        <p className="mt-1 text-xs text-slate-400">
          Paste this into Airbnb&apos;s &quot;Import Calendar&quot; field so our confirmed dates block Airbnb too.
        </p>
        <code className="mt-3 block break-all rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">{exportUrl}</code>
      </div>
    </div>
  );
}
