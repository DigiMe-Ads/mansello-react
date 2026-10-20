"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { AdminField } from "@/components/admin/admin-field";
import { ADMIN_INPUT, ADMIN_SELECT } from "@/components/admin/input-styles";
import {
  createProductOffer,
  deleteProductOffer,
  listProductOffers,
  updateProductOffer,
} from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import { isRenderableImageSrc } from "@/lib/image";
import type { Product, ProductOffer } from "@/lib/api/types";

// Time-limited % off a product (every option of it) or one specific option.
// The shop shows the reduced price with the old one struck through while the
// offer runs, and checkout charges it — nothing to switch on or off by hand.
// If two offers overlap on the same item, the bigger discount wins.

type Status = "running" | "scheduled" | "ended" | "paused";

function statusOf(offer: ProductOffer, now = Date.now()): Status {
  if (!offer.active) return "paused";
  if (Date.parse(offer.endsAt) <= now) return "ended";
  if (Date.parse(offer.startsAt) > now) return "scheduled";
  return "running";
}

const STATUS_STYLE: Record<Status, string> = {
  running: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  paused: "bg-slate-200 text-slate-600",
  ended: "bg-slate-100 text-slate-400",
};
const STATUS_LABEL: Record<Status, string> = {
  running: "Running now",
  scheduled: "Scheduled",
  paused: "Paused",
  ended: "Ended",
};

/** Date → the value a <input type="datetime-local"> expects, in the admin's own timezone. */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OffersTab({ products }: { products: Product[] }) {
  const { authedFetch } = useAdminAuth();
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEnded, setShowEnded] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listProductOffers(authedFetch)
      .then(setOffers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load offers"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const groups = useMemo(() => {
    const by: Record<Status, ProductOffer[]> = { running: [], scheduled: [], paused: [], ended: [] };
    for (const o of offers) by[statusOf(o)].push(o);
    return by;
  }, [offers]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    }
  }

  const sections: { status: Status; title: string }[] = [
    { status: "running", title: "Running now" },
    { status: "scheduled", title: "Coming up" },
    { status: "paused", title: "Paused" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          Put a product — or just one of its options — on sale for a set time. The shop shows the sale price with the
          old price crossed out, and it ends by itself. If two offers cover the same item, the bigger one applies.
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
          }}
          className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          {creating ? "Cancel" : "+ New Offer"}
        </button>
      </div>

      {creating && (
        <OfferForm
          products={products}
          onCancel={() => setCreating(false)}
          onSubmit={async (productId, input) => {
            await createProductOffer(authedFetch, productId, input);
            setCreating(false);
            load();
          }}
        />
      )}

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && offers.length === 0 && !creating && (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          No offers yet. Click <strong>+ New Offer</strong> to put something on sale.
        </p>
      )}

      {!loading &&
        sections.map(({ status, title }) =>
          groups[status].length === 0 ? null : (
            <section key={status} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
              {groups[status].map((offer) =>
                editingId === offer.id ? (
                  <OfferForm
                    key={offer.id}
                    products={products}
                    offer={offer}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (_productId, input) => {
                      await updateProductOffer(authedFetch, offer.id, input);
                      setEditingId(null);
                      load();
                    }}
                  />
                ) : (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onEdit={() => {
                      setEditingId(offer.id);
                      setCreating(false);
                    }}
                    onToggle={() => run(() => updateProductOffer(authedFetch, offer.id, { active: !offer.active }))}
                    onDelete={() => run(() => deleteProductOffer(authedFetch, offer.id))}
                  />
                )
              )}
            </section>
          )
        )}

      {!loading && groups.ended.length > 0 && (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowEnded((v) => !v)}
            className="w-fit text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-slate-600"
          >
            {showEnded ? "▾" : "▸"} Ended ({groups.ended.length})
          </button>
          {showEnded &&
            groups.ended.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={() => setEditingId(offer.id)}
                onToggle={() => run(() => updateProductOffer(authedFetch, offer.id, { active: !offer.active }))}
                onDelete={() => run(() => deleteProductOffer(authedFetch, offer.id))}
              />
            ))}
        </section>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  onEdit,
  onToggle,
  onDelete,
}: {
  offer: ProductOffer;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const status = statusOf(offer);
  const listPrice = Number(offer.variant?.priceUsd ?? offer.product.priceUsd);
  const salePrice = Math.round(listPrice * (100 - offer.discountPercent)) / 100;
  const image = offer.product.images.find((src) => isRenderableImageSrc(src));

  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ${status === "ended" ? "opacity-60" : ""}`}>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {image && <Image src={image} alt="" fill sizes="56px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[#153C4D]">
            {offer.product.name}
            <span className="font-normal text-slate-500">
              {offer.variant ? ` — ${offer.variant.name} only` : " — all options"}
            </span>
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <p className="mt-0.5 text-sm">
          <span className="font-bold text-red-600">{offer.discountPercent}% off</span>
          {offer.title && <span className="text-slate-500"> · “{offer.title}”</span>}
          <span className="ml-2 text-xs text-slate-500">
            {formatMoney(listPrice, "usd")} → <strong>{formatMoney(salePrice, "usd")}</strong>
            {!offer.variant && " (each option gets the same % off)"}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {formatWhen(offer.startsAt)} → {formatWhen(offer.endsAt)}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold">
        <button type="button" onClick={onEdit} className="text-[#153C4D] hover:underline">
          Edit
        </button>
        {status !== "ended" && (
          <button type="button" onClick={onToggle} className="text-slate-500 hover:underline">
            {offer.active ? "Pause" : "Resume"}
          </button>
        )}
        {confirming ? (
          <>
            <button type="button" onClick={onDelete} className="text-red-600 hover:underline">
              Confirm delete?
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="text-slate-400 hover:underline">
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function OfferForm({
  products,
  offer,
  onSubmit,
  onCancel,
}: {
  products: Product[];
  offer?: ProductOffer;
  onSubmit: (
    productId: string,
    input: { variantId: string | null; title: string | null; discountPercent: number; startsAt: string; endsAt: string }
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const [productId, setProductId] = useState(offer?.productId ?? "");
  const [variantId, setVariantId] = useState(offer?.variantId ?? "");
  const [discountPercent, setDiscountPercent] = useState(offer ? String(offer.discountPercent) : "10");
  const [title, setTitle] = useState(offer?.title ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(offer ? new Date(offer.startsAt) : new Date()));
  const [endsAt, setEndsAt] = useState(
    toLocalInput(offer ? new Date(offer.endsAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId);
  const variants = (product?.variants ?? []).filter((v) => v.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const variant = variants.find((v) => v.id === variantId);
  const pct = Number(discountPercent) || 0;
  const previewSource = variant ? [variant] : variants.length > 0 ? variants : product ? [product] : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      setError("Pick a product.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("The offer has to end after it starts.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(productId, {
        variantId: variantId || null,
        title: title.trim() || null,
        discountPercent: pct,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save the offer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-[#8DC63F]/40 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold text-[#153C4D]">{offer ? "Edit offer" : "New offer"}</h3>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <AdminField label="1. Product" required>
          <select
            required
            value={productId}
            disabled={!!offer}
            onChange={(e) => {
              setProductId(e.target.value);
              setVariantId("");
            }}
            className={`${ADMIN_SELECT} disabled:opacity-60`}
          >
            <option value="" disabled>
              Choose a product…
            </option>
            {sorted.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.active ? "" : " (hidden from shop)"}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField
          label="2. Applies to"
          help={variants.length === 0 ? "This product has no options." : "The whole product, or just one option."}
        >
          <select
            value={variantId}
            disabled={variants.length === 0}
            onChange={(e) => setVariantId(e.target.value)}
            className={`${ADMIN_SELECT} disabled:opacity-60`}
          >
            <option value="">{variants.length > 0 ? "All options" : "The product"}</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                Only “{v.name}”
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="3. Discount (%)" required help="Between 1 and 90.">
          <input
            required
            type="number"
            min={1}
            max={90}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className={ADMIN_INPUT}
          />
        </AdminField>

        <AdminField label="Label (optional)" help="Shown next to the price, e.g. “Avurudu sale”.">
          <input
            maxLength={80}
            placeholder="e.g. Weekend deal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={ADMIN_INPUT}
          />
        </AdminField>

        <AdminField label="4. Starts" required>
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={ADMIN_INPUT}
          />
        </AdminField>
        <AdminField label="5. Ends" required help="The normal price comes back automatically at this time.">
          <input
            required
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={ADMIN_INPUT}
          />
        </AdminField>
      </div>

      {previewSource.length > 0 && pct > 0 && (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-500">Customers will see:</p>
          <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            {previewSource.map((item) => {
              const list = Number(item.priceUsd);
              return (
                <li key={item.id}>
                  {"sku" in item && item !== product ? `${item.name}: ` : ""}
                  <span className="text-slate-400 line-through">{formatMoney(list, "usd")}</span>{" "}
                  <strong className="text-red-600">{formatMoney(Math.round(list * (100 - pct)) / 100, "usd")}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Saving..." : offer ? "Save offer" : "Create offer"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
