"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import {
  createTestimonial,
  deleteTestimonial,
  listTestimonialsAdmin,
  updateTestimonial,
} from "@/lib/api/testimonials";
import { ApiRequestError } from "@/lib/api/errors";
import { ITALY_SEED_TESTIMONIALS, SRI_LANKA_SEED_TESTIMONIALS } from "@/lib/testimonials-seed-data";
import type { Site, Testimonial } from "@/lib/api/types";

const ALL_SITES: Site[] = ["italy", "sri_lanka"];

const SITE_FILTERS: { label: string; value: Site | "" }[] = [
  { label: "All Sites", value: "" },
  { label: "Italy", value: "italy" },
  { label: "Sri Lanka", value: "sri_lanka" },
];

export default function AdminTestimonialsPage() {
  return (
    <RequireAdmin roles={["super_admin"]}>
      <TestimonialsContent />
    </RequireAdmin>
  );
}

function TestimonialsContent() {
  const { authedFetch } = useAdminAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [siteFilter, setSiteFilter] = useState<Site | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // The backend requires `site` on every call, including admin ones — an
  // "All Sites" view has to fetch each site separately and merge, rather
  // than being able to omit the filter in one call.
  // Bumped on every load; a response whose ticket is no longer current is
  // discarded. Without this, switching All Sites -> Italy -> Sri Lanka quickly
  // can let the slower earlier response land last and leave the list showing
  // a site the filter buttons say isn't selected.
  const loadTicket = useRef(0);

  const load = useCallback(() => {
    const ticket = ++loadTicket.current;
    setLoading(true);
    setError(null);
    const sites = siteFilter ? [siteFilter] : ALL_SITES;
    Promise.all(sites.map((s) => listTestimonialsAdmin(authedFetch, s)))
      .then((results) => {
        if (ticket !== loadTicket.current) return;
        setTestimonials(results.flat().sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch((err) => {
        if (ticket !== loadTicket.current) return;
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_TESTIMONIALS.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load testimonials"
        );
      })
      .finally(() => {
        if (ticket !== loadTicket.current) return;
        setLoading(false);
      });
  }, [authedFetch, siteFilter]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Both are called straight from onClick, so an unhandled rejection here is
  // completely invisible to the admin — the row simply doesn't change. Report
  // failures the same way the create/edit form below does.
  async function toggleActive(t: Testimonial) {
    setError(null);
    try {
      await updateTestimonial(authedFetch, t.id, { active: !t.active });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update testimonial");
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await deleteTestimonial(authedFetch, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete testimonial");
    }
  }

  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  // One-time (but safely repeatable) action: creates every testimonial in
  // testimonials-seed-data.ts that isn't already in the database — matched
  // by site + name, so clicking this again after the first time is a no-op
  // rather than creating duplicates. This is what both public sites'
  // carousels are waiting on: they read from the database only now, with
  // no hardcoded fallback, so nothing shows there until this has run once.
  async function handleSeed() {
    setSeeding(true);
    setSeedMessage(null);
    setSeedError(null);
    try {
      const existingBySite = await Promise.all(ALL_SITES.map((s) => listTestimonialsAdmin(authedFetch, s)));
      const existing = existingBySite.flat();
      const seedList = [...ITALY_SEED_TESTIMONIALS, ...SRI_LANKA_SEED_TESTIMONIALS];
      const toCreate = seedList.filter(
        (seed) => !existing.some((e) => e.site === seed.site && e.name === seed.name)
      );

      for (const input of toCreate) {
        // eslint-disable-next-line no-await-in-loop -- creating one at a
        // time, deliberately, so a mid-way failure doesn't fire the
        // remaining requests concurrently against a possibly-struggling API
        await createTestimonial(authedFetch, input);
      }

      const skipped = seedList.length - toCreate.length;
      setSeedMessage(
        toCreate.length === 0
          ? "Nothing to seed — every one of these reviews is already in the database."
          : `Added ${toCreate.length} testimonial${toCreate.length === 1 ? "" : "s"}${
              skipped > 0 ? ` (${skipped} already present, skipped)` : ""
            }.`
      );
      load();
    } catch (err) {
      setSeedError(err instanceof ApiRequestError ? err.message : "Failed to seed testimonials");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#153C4D]">Testimonials</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#153C4D] hover:text-[#153C4D] disabled:opacity-60"
          >
            {seeding ? "Seeding..." : "Seed Existing Reviews"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
          >
            {showCreateForm ? "Cancel" : "+ New Testimonial"}
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Both sites&apos; carousels read only from what&apos;s below — there&apos;s no hardcoded fallback anymore.
        Italy and Sri Lanka each show only their own site&apos;s active testimonials, in the order set here. If
        this list is empty, use <span className="font-semibold text-[#153C4D]">Seed Existing Reviews</span> once
        to load the real guest reviews this site launched with — it&apos;s safe to click more than once, it skips
        anything already added.
      </p>

      {seedMessage && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{seedMessage}</p>}
      {seedError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{seedError}</p>}

      <div className="flex gap-2">
        {SITE_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setSiteFilter(f.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              siteFilter === f.value ? "bg-[#153C4D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showCreateForm && (
        <TestimonialForm
          defaultSite={siteFilter || "sri_lanka"}
          onDone={() => {
            setShowCreateForm(false);
            load();
          }}
        />
      )}

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {testimonials.length === 0 && <p className="text-sm text-slate-400">No testimonials yet.</p>}
          {testimonials.map((t) =>
            editingId === t.id ? (
              <TestimonialForm
                key={t.id}
                testimonial={t}
                onDone={() => {
                  setEditingId(null);
                  load();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={t.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#153C4D]">{t.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {t.site === "italy" ? "Italy" : "Sri Lanka"}
                    </span>
                    <span className="text-xs text-amber-500">{"★".repeat(t.rating)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{t.role}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      t.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {t.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingId(t.id);
                    }}
                    className="text-xs font-semibold text-[#153C4D] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(t)}
                    className="text-xs font-semibold text-[#153C4D] hover:underline"
                  >
                    {t.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function TestimonialForm({
  testimonial,
  defaultSite,
  onDone,
  onCancel,
}: {
  testimonial?: Testimonial;
  defaultSite?: Site;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [site, setSite] = useState<Site>(testimonial?.site ?? defaultSite ?? "sri_lanka");
  const [name, setName] = useState(testimonial?.name ?? "");
  const [role, setRole] = useState(testimonial?.role ?? "");
  const [quote, setQuote] = useState(testimonial?.quote ?? "");
  const [rating, setRating] = useState(testimonial?.rating ?? 5);
  const [sortOrder, setSortOrder] = useState(String(testimonial?.sortOrder ?? 0));
  const [active, setActive] = useState(testimonial?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (testimonial) {
        await updateTestimonial(authedFetch, testimonial.id, {
          name,
          role,
          quote,
          rating,
          sortOrder: Number(sortOrder) || 0,
          active,
        });
      } else {
        await createTestimonial(authedFetch, {
          site,
          name,
          role,
          quote,
          rating,
          sortOrder: Number(sortOrder) || 0,
          active,
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save testimonial");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {!testimonial && (
          <select value={site} onChange={(e) => setSite(e.target.value as Site)} className={ADMIN_SELECT}>
            <option value="italy">Italy</option>
            <option value="sri_lanka">Sri Lanka</option>
          </select>
        )}
        <input
          required
          placeholder="Guest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          required
          placeholder="Role (e.g. Airbnb Guest · 3 nights)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`${ADMIN_INPUT} sm:col-span-2`}
        />
        <textarea
          required
          placeholder="Quote"
          rows={3}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className={`${ADMIN_TEXTAREA} sm:col-span-2`}
        />
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Rating (1–5)
          <input
            required
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Display Order (0 = shown first)
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (visible in the carousel now)
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Saving..." : testimonial ? "Save Changes" : "Create Testimonial"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:underline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
