"use client";

import { useState } from "react";
import { usePropertyBooking } from "./booking-provider";
import type { TransportType } from "@/lib/api/types";

export function GuestDetailsForm({ showTransport = true }: { showTransport?: boolean }) {
  const { submitGuestDetails, submitting, submitError, fieldErrors, backToSelect, checkIn } = usePropertyBooking();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestIdDocumentType, setGuestIdDocumentType] = useState("");
  const [guestIdDocumentNumber, setGuestIdDocumentNumber] = useState("");

  const [wantsTransport, setWantsTransport] = useState(false);
  const [transportType, setTransportType] = useState<TransportType>("fixed_price");
  const [transportDate, setTransportDate] = useState(checkIn ?? "");
  const [transportFlightNumber, setTransportFlightNumber] = useState("");
  const [transportNotes, setTransportNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitGuestDetails({
      guestName,
      guestEmail,
      guestPhone,
      guestIdDocumentType,
      guestIdDocumentNumber,
      wantsTransport,
      transportType,
      transportDate: transportDate || undefined,
      transportFlightNumber,
      transportNotes,
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <button
        type="button"
        onClick={backToSelect}
        className="text-sm font-medium text-slate-500 transition hover:text-[#153C4D]"
      >
        ← Change dates
      </button>
      <h3 className="mt-3 text-lg font-bold text-[#153C4D]">Your details</h3>

      {submitError && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div>
          <input
            type="text"
            required
            placeholder="Full name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {fieldErrors.guestName && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.guestName}</p>}
        </div>
        <div>
          <input
            type="email"
            required
            placeholder="Email address"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {fieldErrors.guestEmail && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.guestEmail}</p>}
        </div>
        <div>
          <input
            type="tel"
            required
            placeholder="Phone number"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {fieldErrors.guestPhone && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.guestPhone}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={guestIdDocumentType}
            onChange={(e) => setGuestIdDocumentType(e.target.value)}
            className="rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-600 outline-none"
          >
            <option value="">ID type (optional)</option>
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
          </select>
          <input
            type="text"
            placeholder="ID number (optional)"
            value={guestIdDocumentNumber}
            onChange={(e) => setGuestIdDocumentNumber(e.target.value)}
            className="rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        {showTransport && (
          <>
            <label className="mt-1 flex items-center gap-2 rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={wantsTransport}
                onChange={(e) => setWantsTransport(e.target.checked)}
              />
              Add an airport transfer?
            </label>

            {wantsTransport && (
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value as TransportType)}
                    className="col-span-2 rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none"
                  >
                    <option value="fixed_price">Flat-Rate Transfer</option>
                    <option value="custom_quote">Custom Quote</option>
                  </select>
                  <input
                    type="date"
                    value={transportDate}
                    onChange={(e) => setTransportDate(e.target.value)}
                    className="rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Flight number (optional)"
                    value={transportFlightNumber}
                    onChange={(e) => setTransportFlightNumber(e.target.value)}
                    className="rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <textarea
                    placeholder="Notes (optional) — e.g. arrival & departure details"
                    rows={2}
                    value={transportNotes}
                    onChange={(e) => setTransportNotes(e.target.value)}
                    className="col-span-2 resize-none rounded-2xl bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  We&apos;ll reach out to confirm your transfer separately — passenger count is taken from your booking.
                </p>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
        >
          {submitting ? "Holding your dates..." : "Continue to Payment"}
        </button>
      </form>
    </div>
  );
}
