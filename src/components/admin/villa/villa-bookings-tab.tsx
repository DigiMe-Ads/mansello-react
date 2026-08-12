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
import type { Booking } from "@/lib/api/types";

const STATUS_OPTIONS = ["", "pending_payment", "confirmed", "paid_offline", "cancelled", "completed"];

export function VillaBookingsTab({
  propertyId,
  currency,
  cityTaxEnabled,
}: {
  propertyId: string;
  currency: string;
  cityTaxEnabled?: boolean;
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
                      {b.guests} guest{b.guests > 1 ? "s" : ""} · {b.rooms} room{b.rooms > 1 ? "s" : ""}
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
  onCreated,
}: {
  propertyId: string;
  cityTaxEnabled?: boolean;
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
  const [childrenUnder14, setChildrenUnder14] = useState(0);
  const [totalPriceOverride, setTotalPriceOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        rooms,
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
        <input required placeholder="Guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={ADMIN_INPUT} />
        <input required type="email" placeholder="Email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={ADMIN_INPUT} />
        <input required placeholder="Phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className={ADMIN_INPUT} />
        <input required type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={ADMIN_INPUT} />
        <input required type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={ADMIN_INPUT} />
        <input required type="number" min={1} placeholder="Guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={ADMIN_INPUT} />
        <input required type="number" min={1} placeholder="Rooms" value={rooms} onChange={(e) => setRooms(Number(e.target.value))} className={ADMIN_INPUT} />
        {cityTaxEnabled && (
          <input
            type="number"
            min={0}
            max={guests}
            placeholder="Children under 14 (no city tax)"
            value={childrenUnder14}
            onChange={(e) => setChildrenUnder14(Math.max(0, Math.min(Number(e.target.value), guests)))}
            className={ADMIN_INPUT}
          />
        )}
        <input type="number" min={0} step="0.01" placeholder="Price override (optional)" value={totalPriceOverride} onChange={(e) => setTotalPriceOverride(e.target.value)} className={ADMIN_INPUT} />
      </div>
      <button
        type="submit"
        disabled={submitting}
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
        placeholder="Refund override (optional, defaults to policy)"
        value={refundOverride}
        onChange={(e) => setRefundOverride(e.target.value)}
        className={ADMIN_INPUT}
      />
      <input
        type="text"
        placeholder="Reason (optional)"
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
