"use client";

import { useState } from "react";
import { getPropertyBySlug } from "@/lib/api/properties";
import { submitTransportRequest } from "@/lib/api/leads";
import { ApiRequestError } from "@/lib/api/errors";
import type { TransportType } from "@/lib/api/types";

const labelClass = "mb-1 block text-xs font-semibold text-slate-500";
const inputClass =
  "w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400";
const textareaClass =
  "w-full resize-none rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400";

export function TransportRequestForm({
  propertySlug,
  initialNotes,
}: {
  propertySlug: string;
  initialNotes?: string;
}) {
  // This one form covers both the flat-rate airport transfer and the custom
  // tour-package enquiry — the guest never needs to pick which, since a
  // package enquiry already arrives here with `initialNotes` set (see
  // fixed-price-transfers.tsx). The dropdown that used to ask them to choose
  // "Flat-Rate Transfer" vs "Custom Quote" was redundant with that and
  // confusing on the tour-package page, so the type is inferred instead.
  const type: TransportType = initialNotes ? "custom_quote" : "fixed_price";
  const [date, setDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Best-effort property lookup so the request is linked to the right
    // villa — the backend accepts a missing propertyId too, so a failed
    // lookup here shouldn't block the guest from submitting the request.
    let propertyId: string | undefined;
    try {
      const property = await getPropertyBySlug(propertySlug);
      propertyId = property.id;
    } catch {
      propertyId = undefined;
    }

    try {
      await submitTransportRequest({
        propertyId,
        type,
        date,
        flightNumber: flightNumber || undefined,
        passengers,
        contactName,
        contactEmail,
        contactPhone,
        notes: notes || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-emerald-50 px-6 py-5 text-sm text-emerald-700">
        Thanks — we&apos;ve got your request and will confirm by email (and WhatsApp where possible) shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="transport-date" className={labelClass}>
            Travel date
          </label>
          <input
            id="transport-date"
            name="date"
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="transport-flight-number" className={labelClass}>
            Flight number <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="transport-flight-number"
            name="flightNumber"
            type="text"
            placeholder="e.g. UL 504"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="transport-passengers" className={labelClass}>
            Passengers
          </label>
          <input
            id="transport-passengers"
            name="passengers"
            required
            type="number"
            min={1}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="transport-name" className={labelClass}>
            Your name
          </label>
          <input
            id="transport-name"
            name="name"
            required
            type="text"
            autoComplete="name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="transport-email" className={labelClass}>
            Email
          </label>
          <input
            id="transport-email"
            name="email"
            required
            type="email"
            autoComplete="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="transport-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="transport-phone"
            name="phone"
            required
            type="tel"
            autoComplete="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="transport-notes" className={labelClass}>
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="transport-notes"
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={textareaClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-fit rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send Request"}
      </button>
    </form>
  );
}
