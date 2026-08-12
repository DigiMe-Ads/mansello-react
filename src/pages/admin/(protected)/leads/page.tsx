"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  listContactMessages,
  listNewsletterSubscribers,
  listTransportRequests,
  updateContactMessageStatus,
  updateTransportRequestStatus,
} from "@/lib/api/leads";
import { ApiRequestError } from "@/lib/api/errors";
import { formatDisplayDate } from "@/lib/date";
import type { ContactMessage, LeadStatus, NewsletterSubscriber, TransportRequest } from "@/lib/api/types";

const TABS = ["Contact Messages", "Transport Requests", "Newsletter"] as const;
type Tab = (typeof TABS)[number];

export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>("Contact Messages");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#153C4D]">Leads</h1>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "border-[#153C4D] text-[#153C4D]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Contact Messages" && <ContactMessagesTab />}
      {tab === "Transport Requests" && <TransportRequestsTab />}
      {tab === "Newsletter" && <NewsletterTab />}
    </div>
  );
}

function ContactMessagesTab() {
  const { authedFetch } = useAdminAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listContactMessages(authedFetch)
      .then(setMessages)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setStatus(id: string, status: LeadStatus) {
    await updateContactMessageStatus(authedFetch, id, status);
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
      {messages.map((m) => (
        <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#153C4D]">
                {m.name} <span className="font-normal text-slate-400">({m.email})</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                {m.site.replace("_", " ")} · {m.subject.replace(/_/g, " ")} · {formatDisplayDate(m.createdAt.slice(0, 10))}
              </p>
            </div>
            <StatusBadge status={m.status} />
          </div>
          <p className="mt-3 text-sm text-slate-600">{m.message}</p>
          <div className="mt-3 flex gap-2">
            {m.status !== "read" && (
              <button type="button" onClick={() => setStatus(m.id, "read")} className="text-xs font-semibold text-[#153C4D] hover:underline">
                Mark Read
              </button>
            )}
            {m.status !== "responded" && (
              <button type="button" onClick={() => setStatus(m.id, "responded")} className="text-xs font-semibold text-[#153C4D] hover:underline">
                Mark Responded
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TransportRequestsTab() {
  const { authedFetch } = useAdminAuth();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listTransportRequests(authedFetch)
      .then(setRequests)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load transport requests"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function setStatus(id: string, status: LeadStatus) {
    await updateTransportRequestStatus(authedFetch, id, status);
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      {requests.length === 0 && <p className="text-sm text-slate-400">No transport requests yet.</p>}
      {requests.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#153C4D]">
                {r.contactName} <span className="font-normal text-slate-400">({r.contactPhone})</span>
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                {r.type.replace("_", " ")} · {r.passengers} passenger{r.passengers > 1 ? "s" : ""} ·{" "}
                {formatDisplayDate(r.date.slice(0, 10))}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {r.flightNumber && <p className="mt-2 text-sm text-slate-600">Flight: {r.flightNumber}</p>}
          {r.bookingId && (
            <p className="mt-2 text-xs text-slate-400">
              Added at checkout — linked to booking{" "}
              <span className="font-mono text-slate-500">{r.bookingId.slice(0, 8)}</span>
            </p>
          )}
          {r.notes && <p className="mt-2 text-sm text-slate-600">{r.notes}</p>}
          <div className="mt-3 flex gap-2">
            {r.status !== "read" && (
              <button type="button" onClick={() => setStatus(r.id, "read")} className="text-xs font-semibold text-[#153C4D] hover:underline">
                Mark Read
              </button>
            )}
            {r.status !== "responded" && (
              <button type="button" onClick={() => setStatus(r.id, "responded")} className="text-xs font-semibold text-[#153C4D] hover:underline">
                Mark Responded
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsletterTab() {
  const { authedFetch } = useAdminAuth();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listNewsletterSubscribers(authedFetch)
      .then(setSubscribers)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load subscribers"
        )
      )
      .finally(() => setLoading(false));
  }, [authedFetch]);

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (error) return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Site</th>
            <th className="px-4 py-3">Subscribed</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.length === 0 && (
            <tr>
              <td colSpan={3} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                No subscribers yet.
              </td>
            </tr>
          )}
          {subscribers.map((s) => (
            <tr key={s.id}>
              <td className="border-t border-slate-100 px-4 py-3 text-slate-700">{s.email}</td>
              <td className="border-t border-slate-100 px-4 py-3 capitalize text-slate-600">
                {s.site.replace("_", " ")}
              </td>
              <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                {formatDisplayDate(s.subscribedAt.slice(0, 10))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
