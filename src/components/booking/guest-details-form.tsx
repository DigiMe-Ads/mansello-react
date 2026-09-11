"use client";

import { useState } from "react";
import { usePropertyBooking } from "./booking-provider";
import { formatMoney } from "@/lib/currency";

const labelClass = "mb-1 block pl-1 text-xs font-semibold text-slate-500";

export function GuestDetailsForm({ showTransport = true }: { showTransport?: boolean }) {
  const { submitGuestDetails, submitting, submitError, fieldErrors, backToSelect, checkIn, transportPrice, property, wantsTransport } =
    usePropertyBooking();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestIdDocumentType, setGuestIdDocumentType] = useState("");
  const [guestIdDocumentNumber, setGuestIdDocumentNumber] = useState("");

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
          <label htmlFor="guest-name" className={labelClass}>
            Full name
          </label>
          <input
            id="guest-name"
            name="guestName"
            type="text"
            required
            autoComplete="name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {fieldErrors.guestName && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.guestName}</p>}
        </div>
        <div>
          <label htmlFor="guest-email" className={labelClass}>
            Email address
          </label>
          <input
            id="guest-email"
            name="guestEmail"
            type="email"
            required
            autoComplete="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {fieldErrors.guestEmail && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.guestEmail}</p>}
        </div>
        <div>
          <label htmlFor="guest-phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="guest-phone"
            name="guestPhone"
            type="tel"
            required
            autoComplete="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          {fieldErrors.guestPhone && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.guestPhone}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="guest-id-type" className={labelClass}>
              ID type <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              id="guest-id-type"
              name="guestIdDocumentType"
              value={guestIdDocumentType}
              onChange={(e) => setGuestIdDocumentType(e.target.value)}
              className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-600 outline-none"
            >
              <option value="">Select ID type</option>
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
            </select>
          </div>
          <div>
            <label htmlFor="guest-id-number" className={labelClass}>
              ID number <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="guest-id-number"
              name="guestIdDocumentNumber"
              type="text"
              value={guestIdDocumentNumber}
              onChange={(e) => setGuestIdDocumentNumber(e.target.value)}
              className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {showTransport && (
          <>
            {wantsTransport && (
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <p className="col-span-2 text-sm font-semibold text-[#153C4D]">
                    Airport transfer
                    {transportPrice !== null && property && (
                      <span className="ml-2 font-normal text-slate-500">
                        {formatMoney(transportPrice, property.currency)}, already included in your total
                      </span>
                    )}
                  </p>
                  <div>
                    <label htmlFor="transport-add-on-date" className={labelClass}>
                      Pick-up date
                    </label>
                    <input
                      id="transport-add-on-date"
                      name="transportDate"
                      type="date"
                      value={transportDate}
                      onChange={(e) => setTransportDate(e.target.value)}
                      className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="transport-add-on-flight" className={labelClass}>
                      Flight number <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      id="transport-add-on-flight"
                      name="transportFlightNumber"
                      type="text"
                      value={transportFlightNumber}
                      onChange={(e) => setTransportFlightNumber(e.target.value)}
                      className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="transport-add-on-notes" className={labelClass}>
                      Notes <span className="font-normal text-slate-400">(optional) — e.g. arrival &amp; departure details</span>
                    </label>
                    <textarea
                      id="transport-add-on-notes"
                      name="transportNotes"
                      rows={2}
                      value={transportNotes}
                      onChange={(e) => setTransportNotes(e.target.value)}
                      className="w-full resize-none rounded-2xl bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {transportPrice !== null ? (
                    <>We&apos;ll confirm your pick-up details by email before you travel.</>
                  ) : (
                    <>
                      We&apos;ll reach out to confirm your transfer separately — passenger count is taken from
                      your booking.
                    </>
                  )}
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
