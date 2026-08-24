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
  manual: "Manual block",
};

const SOURCE_COLORS: Record<string, string> = {
  direct: "bg-emerald-100 text-emerald-700",
  airbnb: "bg-rose-100 text-rose-700",
  manual: "bg-slate-200 text-slate-700",
};

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
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SOURCE_COLORS[block.source]}`}>
                      {SOURCE_LABELS[block.source]}
                    </span>
                  </td>
                  {rooms.length > 0 && (
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                      {block.roomId ? (rooms.find((r) => r.id === block.roomId)?.name ?? "Unknown room") : "Whole property"}
                    </td>
                  )}
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                    {formatDisplayDate(block.startDate.slice(0, 10))} → {formatDisplayDate(block.endDate.slice(0, 10))}
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
    setSubmitting(true);
    setError(null);
    try {
      await createManualBlock(authedFetch, propertyId, {
        startDate,
        endDate,
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
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {rooms.length > 0 && (
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={ADMIN_INPUT}>
            <option value="">Whole property</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
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
          type="text"
          placeholder="Reason (optional, e.g. maintenance)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`${ADMIN_INPUT} flex-1`}
        />
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
