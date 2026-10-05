"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import { createManualBlock, getAvailability, releaseBlock } from "@/lib/api/availability";
import { ApiRequestError } from "@/lib/api/errors";
import { addDaysToKey, formatDisplayDate, todayKey } from "@/lib/date";
import type { AvailabilityBlock, Room } from "@/lib/api/types";

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct booking",
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  manual: "Manual block",
};

const SOURCE_COLORS: Record<string, string> = {
  direct: "bg-emerald-100 text-emerald-700",
  airbnb: "bg-rose-100 text-rose-700",
  booking_com: "bg-blue-100 text-blue-700",
  manual: "bg-slate-200 text-slate-700",
};

// The backend's iCal import tags every imported feed as "airbnb", whatever
// channel it came from. The event UID still says where it really came from
// (Booking.com UIDs end "@booking.com"), so label from that until the
// backend sets source "booking_com" itself.
function displaySource(block: AvailabilityBlock): string {
  if (block.source === "airbnb" && block.externalUid?.toLowerCase().endsWith("@booking.com")) return "booking_com";
  return block.source;
}

// Blocks are stored half-open, [startDate, endDate): endDate is the first
// day that is free again (a booking's check-out day). That's natural for
// bookings, but not for an admin blocking "the 15th", who expects to enter
// 15th → 15th — so manual blocks are entered and shown as an inclusive
// range of blocked nights, and converted at the edges.
function nightsBetween(startKey: string, endKey: string): number {
  return Math.round((Date.parse(endKey) - Date.parse(startKey)) / 86_400_000);
}

function BlockDates({ block }: { block: AvailabilityBlock }) {
  const start = block.startDate.slice(0, 10);
  const end = block.endDate.slice(0, 10);
  const nights = nightsBetween(start, end);

  if (nights <= 0) {
    return (
      <span className="font-semibold text-amber-700">
        {formatDisplayDate(start)} — blocks nothing (end date was not after the start). Release and re-add it.
      </span>
    );
  }

  const nightsLabel = `${nights} night${nights === 1 ? "" : "s"}`;
  if (block.source === "manual") {
    const lastNight = addDaysToKey(end, -1);
    return (
      <>
        {lastNight === start
          ? formatDisplayDate(start)
          : `${formatDisplayDate(start)} – ${formatDisplayDate(lastNight)}`}
        <span className="ml-2 text-xs text-slate-400">{nightsLabel}</span>
      </>
    );
  }
  return (
    <>
      {formatDisplayDate(start)} → {formatDisplayDate(end)}
      <span className="ml-2 text-xs text-slate-400">
        {nightsLabel}, check-out {formatDisplayDate(end)} stays free
      </span>
    </>
  );
}

export function VillaBlocksTab({ propertyId, rooms = [] }: { propertyId: string; rooms?: Room[] }) {
  const { authedFetch } = useAdminAuth();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const from = todayKey();
    const to = addDaysToKey(from, 365);
    getAvailability(propertyId, from, to)
      .then((result) => setBlocks(result.sort((a, b) => a.startDate.localeCompare(b.startDate))))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load availability"))
      .finally(() => setLoading(false));
  }, [propertyId]);

  useEffect(() => {
    // Standard fetch-on-mount: `load` itself synchronously flips
    // `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRelease(blockId: string) {
    try {
      await releaseBlock(authedFetch, blockId);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to release block");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <NewBlockForm propertyId={propertyId} rooms={rooms} onCreated={load} />

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Source</th>
                {rooms.length > 0 && <th className="px-4 py-3">Room</th>}
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {blocks.length === 0 && (
                <tr>
                  <td
                    colSpan={rooms.length > 0 ? 4 : 3}
                    className="border-t border-slate-100 px-4 py-6 text-center text-slate-400"
                  >
                    No blocked dates in the next 12 months.
                  </td>
                </tr>
              )}
              {blocks.map((block) => (
                <tr key={block.id}>
                  <td className="border-t border-slate-100 px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SOURCE_COLORS[displaySource(block)]}`}>
                      {SOURCE_LABELS[displaySource(block)]}
                    </span>
                  </td>
                  {rooms.length > 0 && (
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                      {block.roomId ? (rooms.find((r) => r.id === block.roomId)?.name ?? "Unknown room") : "Whole property"}
                    </td>
                  )}
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                    <BlockDates block={block} />
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 text-right">
                    {block.source === "manual" && (
                      <button
                        type="button"
                        onClick={() => handleRelease(block.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Release
                      </button>
                    )}
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

function NewBlockForm({
  propertyId,
  rooms,
  onCreated,
}: {
  propertyId: string;
  rooms: Room[];
  onCreated: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [roomId, setRoomId] = useState(""); // "" = whole property
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) {
      setError("The last blocked night can't be before the first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createManualBlock(authedFetch, propertyId, {
        startDate,
        // `endDate` here is the last blocked night (inclusive); the API
        // wants the first free day after it.
        endDate: addDaysToKey(endDate, 1),
        reason: reason || undefined,
        roomId: roomId || undefined,
      });
      setStartDate("");
      setEndDate("");
      setReason("");
      setRoomId("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create block");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Add Manual Block</h3>
      <p className="mt-1 text-xs text-slate-400">
        Pick the first and last night to block — both are included. To block just the 15th, choose the 15th for both.
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        {rooms.length > 0 && (
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Room
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={`${ADMIN_INPUT} font-normal normal-case`}>
              <option value="">Whole property</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          First night blocked
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
            }}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Last night blocked
          <input
            required
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Reason <span className="font-normal normal-case text-slate-400">(optional)</span>
          <input
            type="text"
            placeholder="e.g. maintenance"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add Block"}
        </button>
      </div>
    </form>
  );
}
