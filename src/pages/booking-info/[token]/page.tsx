"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookingInfoRequestByToken, submitBookingInfoRequest } from "@/lib/api/guest-info";
import { ApiRequestError } from "@/lib/api/errors";
import { formatDisplayDate } from "@/lib/date";
import { FileUploadField } from "@/components/booking-info/file-upload-field";
import type {
  BookingInfoRequestPublicView,
  GuestInfoAnswerValue,
  GuestInfoAnswers,
  GuestInfoField,
} from "@/lib/api/types";
import { useSeo } from "@/lib/seo/use-seo";
import { PRIVATE_META } from "@/lib/seo/page-meta";

const inputClass =
  "w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#153C4D]";
const textareaClass =
  "w-full resize-none rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#153C4D]";

function FieldInput({
  field,
  value,
  onChange,
  token,
}: {
  field: GuestInfoField;
  value: GuestInfoAnswerValue | undefined;
  onChange: (value: GuestInfoAnswerValue) => void;
  token: string;
}) {
  switch (field.type) {
    case "file":
      return (
        <FileUploadField
          token={token}
          value={value as string[] | undefined}
          onChange={onChange}
        />
      );
    case "textarea":
      return (
        <textarea
          required={field.required}
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={textareaClass}
        />
      );
    case "select":
      return (
        <select
          required={field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select...
          </option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          Yes
        </label>
      );
    case "date":
      return (
        <input
          required={field.required}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
    case "number":
      return (
        <input
          required={field.required}
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
    default:
      return (
        <input
          required={field.required}
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}

export default function BookingInfoPage() {
  const { token = "" } = useParams<{ token: string }>();

  const [view, setView] = useState<BookingInfoRequestPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<GuestInfoAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getBookingInfoRequestByToken(token)
      .then(setView)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "This link isn't valid. Please check the email again or contact us."
            : err instanceof Error
              ? err.message
              : "Something went wrong loading this page."
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Native `required` handles every field type except "file" — there's no
    // plain input to attach it to, so check those by hand before submitting.
    const missingUpload = view?.fields.find(
      (f) => f.required && f.type === "file" && !(answers[f.id] as string[] | undefined)?.length
    );
    if (missingUpload) {
      setError(`Please upload "${missingUpload.label}" before submitting.`);
      return;
    }

    setSubmitting(true);
    try {
      await submitBookingInfoRequest(token, { answers });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  useSeo(PRIVATE_META.bookingInfo());

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F5A623]">Mansello</p>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}

        {!loading && error && !view && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!loading && view && (
          <>
            <h1 className="mt-2 text-2xl font-bold text-[#153C4D]">
              {view.propertyName} — a few more details
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Hi {view.guestName}, we just need a bit more information ahead of your stay
              {" "}
              ({formatDisplayDate(view.checkIn.slice(0, 10))} – {formatDisplayDate(view.checkOut.slice(0, 10))}).
            </p>

            {(submitted || view.status === "submitted") && (
              <p className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                Thanks — we&apos;ve received your details. No further action needed.
              </p>
            )}

            {view.status === "expired" && !submitted && (
              <p className="mt-6 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800">
                This link has expired. Please contact us and we&apos;ll send you a new one.
              </p>
            )}

            {view.status === "pending" && !submitted && (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

                {view.fields.map((field) => (
                  <div key={field.id}>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {field.label}
                      {field.required && <span className="text-[#F5A623]"> *</span>}
                    </label>
                    <FieldInput
                      field={field}
                      value={answers[field.id]}
                      onChange={(value) => setAnswers((a) => ({ ...a, [field.id]: value }))}
                      token={token}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-full bg-[#8DC63F] py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
