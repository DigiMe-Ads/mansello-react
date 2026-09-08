"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { ADMIN_INPUT, ADMIN_SELECT } from "@/components/admin/input-styles";
import { GuestInfoRequestPanel } from "@/components/admin/villa/guest-info-request-panel";
import { cancelBooking, createOfflineBooking, listBookingsForProperty } from "@/lib/api/bookings";
import { ApiRequestError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import { formatDisplayDate } from "@/lib/date";
import type { Booking, Room } from "@/lib/api/types";
import { AdminField } from "@/components/admin/admin-field";

const STATUS_OPTIONS = ["", "pending_payment", "confirmed", "paid_offline", "cancelled", "completed"];

// Bookings only carry room *ids* (`roomIds`) — resolve them to names against
// the property's room list for display. Falls back to "Unknown room" for an
// id that no longer matches (e.g. the room was since deleted).
function roomNames(booking: Booking, rooms: Room[]): string | null {
  if (!booking.roomIds?.length) return null;
  // Include a short id fragment for an id that doesn't match any of the
  // property's current rooms (deleted room, or a stale/mismatched
  // reference) — "Unknown room" alone is a dead end; the id fragment at
  // least lets staff cross-check it against the Rooms tab, which now shows
  // each room's full id.
  return booking.roomIds
    .map((id) => rooms.find((r) => r.id === id)?.name ?? `Unknown room (${id.slice(0, 8)}…)`)
    .join(", ");
}

export function VillaBookingsTab({
  propertyId,
  currency,
  cityTaxEnabled,
  rooms = [],
}: {
  propertyId: string;
  currency: string;
  cityTaxEnabled?: boolean;
  rooms?: Room[];
}) {
  const { authedFetch } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [infoRequestId, setInfoRequestId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listBookingsForProperty(authedFetch, propertyId, statusFilter || undefined)
      .then(setBookings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [authedFetch, propertyId, statusFilter]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={ADMIN_SELECT}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "All statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowOfflineForm((v) => !v)}
          className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          {showOfflineForm ? "Cancel New Booking" : "+ New Offline Booking"}
        </button>
      </div>

      {showOfflineForm && (
        <OfflineBookingForm
          propertyId={propertyId}
          cityTaxEnabled={cityTaxEnabled}
          rooms={rooms}
          onCreated={() => {
            setShowOfflineForm(false);
            load();
          }}
        />
      )}

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Guests/Rooms</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    No bookings found.
                  </td>
                </tr>
              )}
              {bookings.map((b) => (
                <Fragment key={b.id}>
                  <tr>
                    <td className="border-t border-slate-100 px-4 py-3">
                      <p className="font-semibold text-[#153C4D]">{b.guestName}</p>
                      <p className="text-xs text-slate-400">{b.guestEmail}</p>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                      {formatDisplayDate(b.checkIn.slice(0, 10))} → {formatDisplayDate(b.checkOut.slice(0, 10))}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                      {b.guests} guest{b.guests > 1 ? "s" : ""}
                      {roomNames(b, rooms) ? (
                        <span className="mt-0.5 block text-xs text-slate-400">{roomNames(b, rooms)}</span>
                      ) : (
                        <> · {b.rooms} room{b.rooms > 1 ? "s" : ""}</>
                      )}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 font-semibold text-[#153C4D]">
                      {formatMoney(b.totalPrice, currency)}
                      {Number(b.cityTax ?? 0) > 0 && (
                        <span className="mt-0.5 block text-xs font-normal text-slate-400">
                          incl. {formatMoney(b.cityTax!, currency)} city tax
                        </span>
                      )}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {(b.status === "confirmed" || b.status === "paid_offline") && (
                          <button
                            type="button"
                            onClick={() => setInfoRequestId(infoRequestId === b.id ? null : b.id)}
                            className="text-xs font-semibold text-[#153C4D] hover:underline"
                          >
                            Guest Info
                          </button>
                        )}
                        {(b.status === "confirmed" || b.status === "paid_offline" || b.status === "pending_payment") && (
                          <button
                            type="button"
                            onClick={() => setCancelingId(cancelingId === b.id ? null : b.id)}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {cancelingId === b.id && (
                    <tr>
                      <td colSpan={6} className="border-t border-slate-100 bg-red-50/50 px-4 py-4">
                        <CancelBookingForm
                          bookingId={b.id}
                          onDone={() => {
                            setCancelingId(null);
                            load();
                          }}
                          onDismiss={() => setCancelingId(null)}
                        />
                      </td>
                    </tr>
                  )}
                  {infoRequestId === b.id && (
                    <tr>
                      <td colSpan={6} className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                        <GuestInfoRequestPanel bookingId={b.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OfflineBookingForm({
  propertyId,
  cityTaxEnabled,
  rooms: propertyRooms = [],
  onCreated,
}: {
  propertyId: string;
  cityTaxEnabled?: boolean;
  rooms?: Room[];
  onCreated: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [childrenUnder14, setChildrenUnder14] = useState(0);
  const [totalPriceOverride, setTotalPriceOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRooms = propertyRooms.length > 0;

  function toggleRoomId(id: string) {
    setRoomIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createOfflineBooking(authedFetch, {
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        guests,
        rooms: hasRooms ? roomIds.length : rooms,
        roomIds: hasRooms ? roomIds : undefined,
        childrenUnder14: cityTaxEnabled ? childrenUnder14 : undefined,
        totalPriceOverride: totalPriceOverride ? Number(totalPriceOverride) : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminField label="Guest name" required>
          <input required value={guestName} onChange={(e) => setGuestName(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Email address" required>
          <input required type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Phone number" required>
          <input required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Check-in date" required>
          <input required type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Check-out date" required>
          <input required type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Number of guests" required>
          <input required type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={ADMIN_INPUT} />
        </AdminField>
        {!hasRooms && (
          <AdminField label="Number of rooms" required>
            <input required type="number" min={1} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} className={ADMIN_INPUT} />
          </AdminField>
        )}
        {cityTaxEnabled && (
          <AdminField label="Children under 14" help="Exempt from city tax.">
            <input
              type="number"
              min={0}
              max={guests}
              value={childrenUnder14}
              onChange={(e) => setChildrenUnder14(Math.max(0, Math.min(Number(e.target.value), guests)))}
              className={ADMIN_INPUT}
            />
          </AdminField>
        )}
        <AdminField label="Price override" help="Leave blank to use the calculated price.">
          <input type="number" min={0} step="0.01" placeholder="0.00" value={totalPriceOverride} onChange={(e) => setTotalPriceOverride(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
      </div>

      {hasRooms && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rooms</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {propertyRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => toggleRoomId(room.id)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  roomIds.includes(room.id)
                    ? "border-[#153C4D] bg-[#153C4D] text-white"
                    : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
          {roomIds.length === 0 && (
            <p className="mt-1 text-xs text-red-600">Pick at least one room.</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (hasRooms && roomIds.length === 0)}
        className="mt-4 rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create Booking"}
      </button>
    </form>
  );
}

function CancelBookingForm({
  bookingId,
  onDone,
  onDismiss,
}: {
  bookingId: string;
  onDone: () => void;
  onDismiss: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [refundOverride, setRefundOverride] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await cancelBooking(authedFetch, bookingId, {
        refundOverride: refundOverride ? Number(refundOverride) : undefined,
        reason: reason || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to cancel booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
      <input
        type="number"
        min={0}
        step="0.01"
        placeholder="Refund amount — leave blank to use the cancellation policy"
        value={refundOverride}
        onChange={(e) => setRefundOverride(e.target.value)}
        className={ADMIN_INPUT}
      />
      <input
        type="text"
        placeholder="Reason for cancelling (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={ADMIN_INPUT}
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {submitting ? "Cancelling..." : "Confirm Cancel"}
      </button>
      <button type="button" onClick={onDismiss} className="text-xs font-semibold text-slate-500 hover:underline">
        Dismiss
      </button>
    </div>
  );
}
