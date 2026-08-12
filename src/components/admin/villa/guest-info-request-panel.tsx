"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { createBookingInfoRequest, listBookingInfoRequests } from "@/lib/api/guest-info";
import { ApiRequestError } from "@/lib/api/errors";
import { formatDisplayDate } from "@/lib/date";
import type { BookingInfoRequest, GuestInfoAnswerValue } from "@/lib/api/types";

function AnswerValue({ value }: { value: GuestInfoAnswerValue }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <>—</>;
    return (
      <span className="flex flex-col gap-1">
        {value.map((url, i) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#153C4D] underline underline-offset-2 hover:text-[#0e2c38]"
          >
            Document {i + 1}
          </a>
        ))}
      </span>
    );
  }
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  return <>{value || "—"}</>;
}

export function GuestInfoRequestPanel({ bookingId }: { bookingId: string }) {
  const { authedFetch } = useAdminAuth();
  const [requests, setRequests] = useState<BookingInfoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listBookingInfoRequests(authedFetch, bookingId)
      .then(setRequests)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_GUEST_INFO_REQUESTS.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load"
        )
      )
      .finally(() => setLoading(false));
  }, [authedFetch, bookingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await createBookingInfoRequest(authedFetch, bookingId);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to send the request");
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;

  const latest = requests[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {!latest && <p className="text-sm text-slate-400">No info request sent yet for this booking.</p>}

      {latest && (
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={latest.status} />
            <span className="text-xs text-slate-400">Sent {formatDisplayDate(latest.createdAt.slice(0, 10))}</span>
            {latest.submittedAt && (
              <span className="text-xs text-slate-400">
                · Submitted {formatDisplayDate(latest.submittedAt.slice(0, 10))}
              </span>
            )}
            {latest.status !== "submitted" && (
              <button
                type="button"
                onClick={() => handleCopyLink(latest.link)}
                className="text-xs font-semibold text-[#153C4D] hover:underline"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            )}
          </div>

          {latest.status === "submitted" && latest.answers && (
            <dl className="mt-3 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
              {latest.fields.map((f) => (
                <div key={f.id} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{f.label}</dt>
                  <dd className="text-sm text-slate-700">
                    <AnswerValue value={latest.answers![f.id]} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        className="w-fit rounded-full bg-[#8DC63F] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
      >
        {sending ? "Sending..." : latest ? "Send New Link" : "Request Guest Info"}
      </button>
    </div>
  );
}
