"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { createOffer, deleteOffer, getOffers, updateOffer } from "@/lib/api/offers";
import { uploadImages } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/errors";
import type { Offer } from "@/lib/api/types";

export function VillaOffersTab({ propertyId }: { propertyId: string }) {
  const { authedFetch } = useAdminAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getOffers(propertyId)
      .then(setOffers)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load offers"
        )
      )
      .finally(() => setLoading(false));
  }, [propertyId]);

  useEffect(() => {
    // Standard fetch-on-mount: `load` itself synchronously flips
    // `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggleActive(offer: Offer) {
    await updateOffer(authedFetch, offer.id, { active: !offer.active });
    load();
  }

  async function remove(id: string) {
    await deleteOffer(authedFetch, id);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          The homepage deal card shows whichever offer below is marked Active.
        </p>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          {showCreateForm ? "Cancel" : "+ New Offer"}
        </button>
      </div>

      {showCreateForm && (
        <CreateOfferForm
          propertyId={propertyId}
          onCreated={() => {
            setShowCreateForm(false);
            load();
          }}
        />
      )}

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {offers.length === 0 && <p className="text-sm text-slate-400">No offers yet.</p>}
          {offers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <p className="font-semibold text-[#153C4D]">
                  {offer.title} — {offer.discountPercent}% off
                </p>
                {offer.startDate && offer.endDate ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {offer.startDate.slice(0, 10)} → {offer.endDate.slice(0, 10)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400">No date range — applies whenever active</p>
                )}
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    offer.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {offer.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleActive(offer)}
                  className="text-xs font-semibold text-[#153C4D] hover:underline"
                >
                  {offer.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(offer.id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateOfferForm({ propertyId, onCreated }: { propertyId: string; onCreated: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [title, setTitle] = useState("Get Special Offer");
  const [discountPercent, setDiscountPercent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createOffer(authedFetch, {
        propertyId,
        title,
        discountPercent: Number(discountPercent),
        imageUrl: images[0],
        active,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create offer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Title (e.g. Get Special Offer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          required
          type="number"
          min={1}
          max={100}
          placeholder="Discount %"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className={ADMIN_INPUT}
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Starts
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ends
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Leave both blank to apply whenever this offer is active, with no date limit. When set, the discount is
        prorated per night — only nights inside this range get {discountPercent || "the"}% off.
      </p>
      <div className="mt-3">
        <ImageDropzone
          images={images}
          onChange={setImages}
          upload={(files) => uploadImages(authedFetch, files).then((r) => r.urls)}
          label="Deal card image"
          multiple={false}
        />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (show on the homepage now)
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create Offer"}
      </button>
    </form>
  );
}
