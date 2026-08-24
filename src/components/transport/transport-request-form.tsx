"use client";

import { useState } from "react";
import { getPropertyBySlug } from "@/lib/api/properties";
import { submitTransportRequest } from "@/lib/api/leads";
import { ApiRequestError } from "@/lib/api/errors";
import type { TransportType } from "@/lib/api/types";

const inputClass =
  "rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400";
const textareaClass =
  "resize-none rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400";

export function TransportRequestForm({
  propertySlug,
  initialNotes,
}: {
  propertySlug: string;
  initialNotes?: string;
}) {
  const [type, setType] = useState<TransportType>("fixed_price");
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
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TransportType)}
          className={`${inputClass} sm:col-span-2`}
        >
          <option value="fixed_price">Flat-Rate Transfer</option>
          <option value="custom_quote">Custom Quote</option>
        </select>
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Flight number (optional)"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="number"
          min={1}
          placeholder="Passengers"
          value={passengers}
          onChange={(e) => setPassengers(Number(e.target.value))}
          className={inputClass}
        />
        <input
          required
          type="text"
          placeholder="Your name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className={inputClass}
        />
        <input
          required
          type="tel"
          placeholder="Phone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className={inputClass}
        />
        <textarea
          placeholder="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${textareaClass} sm:col-span-2`}
        />
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
