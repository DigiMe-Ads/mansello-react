"use client";

import { useState } from "react";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
  uploadProductImages,
} from "@/lib/api/marketplace";
import { ApiRequestError, isConflict } from "@/lib/api/errors";
import type { CreateProductVariantInput, Product, ProductVariant } from "@/lib/api/types";

// Product variations (e.g. 80ml / 100ml). Optional: a product without any
// sells exactly as before. Each variation has its own SKU, price, weight and
// stock. See BACKEND_CHANGES_VARIANTS_CALENDAR_PAYMENTS_LK.md §1.

const CELL = `${ADMIN_INPUT} w-full min-w-0 px-3`;

export interface VariantDraft {
  name: string;
  sku: string;
  priceUsd: string;
  weightKg: string;
  initialStock: string;
  lowStockThreshold: string;
  images: string[];
}

export const EMPTY_VARIANT: VariantDraft = {
  name: "",
  sku: "",
  priceUsd: "",
  weightKg: "",
  initialStock: "0",
  lowStockThreshold: "5",
  images: [],
};

/**
 * Photos for one option, shown to customers when they pick it (the product's
 * own photos follow). Collapsed to a small toggle until opened.
 */
function OptionPhotos({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const { authedFetch } = useAdminAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="col-span-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#153C4D]"
      >
        <ImageIcon size={14} />
        {images.length > 0 ? `Photos for this option (${images.length})` : "Add photos for this option"}
        <span className="text-slate-300">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="mt-2">
          <ImageDropzone
            compact
            label="Option photos"
            images={images}
            onChange={onChange}
            upload={(files) => uploadProductImages(authedFetch, files).then((r) => r.urls)}
          />
        </div>
      )}
    </div>
  );
}

/** Returns an error message, or null when the drafts are valid. */
export function validateVariantDrafts(drafts: VariantDraft[]): string | null {
  if (drafts.length === 0) return "Add at least one variation, or untick “This product has variations”.";
  for (const [i, d] of drafts.entries()) {
    if (!d.name.trim() || !d.sku.trim() || d.priceUsd === "")
      return `Variation ${i + 1} needs a name, SKU and price.`;
  }
  const names = drafts.map((d) => d.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return "Each variation needs a different name.";
  const skus = drafts.map((d) => d.sku.trim().toLowerCase());
  if (new Set(skus).size !== skus.length) return "Each variation needs its own SKU.";
  return null;
}

export function draftToInput(d: VariantDraft): CreateProductVariantInput {
  return {
    name: d.name.trim(),
    sku: d.sku.trim(),
    priceUsd: Number(d.priceUsd),
    weightKg: d.weightKg ? Number(d.weightKg) : undefined,
    initialStock: Number(d.initialStock || 0),
    lowStockThreshold: d.lowStockThreshold === "" ? undefined : Number(d.lowStockThreshold),
    images: d.images,
  };
}

function HeaderRow({ withStock }: { withStock: boolean }) {
  const cols = ["Name *", "SKU *", "Price (USD) *", "Weight (kg)"];
  if (withStock) cols.push("Stock *");
  cols.push("Low stock at");
  return (
    <>
      {cols.map((c) => (
        <span key={c} className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {c}
        </span>
      ))}
      <span />
    </>
  );
}

const GRID_CREATE = "grid grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.7fr_0.8fr_auto] items-center gap-2";

/** Variation rows on the "new product" form. */
export function VariantRowsEditor({
  drafts,
  onChange,
}: {
  drafts: VariantDraft[];
  onChange: (drafts: VariantDraft[]) => void;
}) {
  function update(i: number, patch: Partial<VariantDraft>) {
    onChange(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 p-4">
      <div className={`${GRID_CREATE} min-w-[720px]`}>
        <HeaderRow withStock />
        {drafts.map((d, i) => (
          <VariantDraftCells key={i} draft={d} onChange={(patch) => update(i, patch)} onRemove={() => onChange(drafts.filter((_, j) => j !== i))} withStock />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...drafts, { ...EMPTY_VARIANT, images: [], priceUsd: drafts.at(-1)?.priceUsd ?? "" }])}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#153C4D] hover:underline"
      >
        <Plus size={14} /> Add option
      </button>
    </div>
  );
}

function VariantDraftCells({
  draft: d,
  onChange,
  onRemove,
  withStock,
}: {
  draft: VariantDraft;
  onChange: (patch: Partial<VariantDraft>) => void;
  onRemove: () => void;
  withStock: boolean;
}) {
  return (
    <>
      <input aria-label="Variation name" placeholder="e.g. 80ml" value={d.name} onChange={(e) => onChange({ name: e.target.value })} className={CELL} />
      <input aria-label="Variation SKU" placeholder="e.g. CREAM-80" value={d.sku} onChange={(e) => onChange({ sku: e.target.value })} className={CELL} />
      <input aria-label="Variation price" type="number" min={0} step="0.01" placeholder="0.00" value={d.priceUsd} onChange={(e) => onChange({ priceUsd: e.target.value })} className={CELL} />
      <input aria-label="Variation weight in kg" type="number" min={0} step="0.01" placeholder="0.00" value={d.weightKg} onChange={(e) => onChange({ weightKg: e.target.value })} className={CELL} />
      {withStock && (
        <input aria-label="Initial stock" type="number" min={0} value={d.initialStock} onChange={(e) => onChange({ initialStock: e.target.value })} className={CELL} />
      )}
      <input aria-label="Low stock alert at" type="number" min={0} value={d.lowStockThreshold} onChange={(e) => onChange({ lowStockThreshold: e.target.value })} className={CELL} />
      <button type="button" onClick={onRemove} aria-label="Remove variation" className="text-slate-400 hover:text-red-600">
        <Trash2 size={16} />
      </button>
      <OptionPhotos images={d.images} onChange={(images) => onChange({ images })} />
    </>
  );
}

/** Variations of an existing product, on its Edit panel. Each row saves on its own. */
export function VariantManager({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const variants = [...(product.variants ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const [adding, setAdding] = useState<VariantDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { authedFetch } = useAdminAuth();

  async function handleAdd() {
    if (!adding) return;
    const problem = validateVariantDrafts([adding]);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createProductVariant(authedFetch, product.id, draftToInput(adding));
      setAdding(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to add the variation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#153C4D]">Options (sizes, flavours…)</h4>
      <p className="mt-1 text-xs text-slate-400">
        Optional. When a product has options, customers pick one, and that option&apos;s own price, SKU, weight, photos
        and stock are used. Change quantities on the <strong>Stock</strong> tab; put an option on sale from the{" "}
        <strong>Offers</strong> tab.
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {variants.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.8fr_auto] gap-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Name</span>
            <span>SKU</span>
            <span>Price (USD)</span>
            <span>Weight (kg)</span>
            <span>Low stock at</span>
            <span>Stock</span>
          </div>
          {variants.map((v) => (
            <ExistingVariantRow key={v.id} product={product} variant={v} onChanged={onChanged} />
          ))}
        </div>
      )}

      {adding ? (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-dashed border-slate-300 p-4">
          <div className={`${GRID_CREATE} min-w-[720px]`}>
            <HeaderRow withStock />
            <VariantDraftCells draft={adding} onChange={(patch) => setAdding({ ...adding, ...patch })} onRemove={() => setAdding(null)} withStock />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="mt-3 rounded-full bg-[#153C4D] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
          >
            {busy ? "Adding..." : "Add option"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding({ ...EMPTY_VARIANT, images: [], priceUsd: variants.at(-1)?.priceUsd ?? product.priceUsd })}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#153C4D] hover:underline"
        >
          <Plus size={14} /> Add an option
        </button>
      )}
      {variants.length === 0 && !adding && (
        <p className="mt-2 text-xs text-slate-400">
          Adding the first variation switches this product to per-variation stock — its current product-level stock
          is no longer sold.
        </p>
      )}
    </div>
  );
}

function ExistingVariantRow({
  product,
  variant,
  onChanged,
}: {
  product: Product;
  variant: ProductVariant;
  onChanged: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [draft, setDraft] = useState({
    name: variant.name,
    sku: variant.sku,
    priceUsd: variant.priceUsd,
    weightKg: variant.weightKg ?? "",
    lowStockThreshold: String(variant.stockLevel?.lowStockThreshold ?? ""),
    images: variant.images ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedByOrders, setBlockedByOrders] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const stock = variant.stockLevel;
  const low = stock && stock.quantityOnHand <= stock.lowStockThreshold;

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setBlockedByOrders(isConflict(err));
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  const save = () =>
    run(() =>
      updateProductVariant(authedFetch, product.id, variant.id, {
        name: draft.name.trim(),
        sku: draft.sku.trim(),
        priceUsd: Number(draft.priceUsd),
        weightKg: draft.weightKg !== "" ? Number(draft.weightKg) : undefined,
        lowStockThreshold: draft.lowStockThreshold !== "" ? Number(draft.lowStockThreshold) : undefined,
        images: draft.images,
      })
    );

  return (
    <div className={`rounded-xl border px-3 py-2 ${variant.active ? "border-slate-200" : "border-slate-200 bg-slate-50 opacity-70"}`}>
      <div className="grid grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr_0.8fr_auto] items-center gap-2 overflow-x-auto">
        <input aria-label="Variation name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={CELL} />
        <input aria-label="Variation SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} className={CELL} />
        <input aria-label="Variation price" type="number" min={0} step="0.01" value={draft.priceUsd} onChange={(e) => setDraft({ ...draft, priceUsd: e.target.value })} className={CELL} />
        <input aria-label="Variation weight in kg" type="number" min={0} step="0.01" placeholder="kg" value={draft.weightKg} onChange={(e) => setDraft({ ...draft, weightKg: e.target.value })} className={CELL} />
        <input aria-label="Low stock alert at" type="number" min={0} placeholder="Low at" value={draft.lowStockThreshold} onChange={(e) => setDraft({ ...draft, lowStockThreshold: e.target.value })} className={CELL} />
        <span className={`whitespace-nowrap text-xs ${low ? "font-semibold text-amber-700" : "text-slate-500"}`}>
          {stock ? `${stock.quantityOnHand} on hand` : "no stock"}
        </span>
        <OptionPhotos images={draft.images} onChange={(images) => setDraft({ ...draft, images })} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
        <button type="button" onClick={save} disabled={saving} className="text-[#153C4D] hover:underline disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => run(() => updateProductVariant(authedFetch, product.id, variant.id, { active: !variant.active }))}
          disabled={saving}
          className="text-slate-500 hover:underline disabled:opacity-60"
        >
          {variant.active ? "Hide from shop" : "Show in shop"}
        </button>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={() => run(() => deleteProductVariant(authedFetch, product.id, variant.id))}
              disabled={saving}
              className="text-red-600 hover:underline disabled:opacity-60"
            >
              Delete? Past orders keep their record
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="text-slate-400 hover:underline">
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-red-600 hover:underline">
            Delete
          </button>
        )}
        {!variant.active && <span className="font-normal text-slate-400">Hidden from the shop</span>}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-700">
          {error}
          {blockedByOrders && variant.active && " — use “Hide from shop” instead."}
        </p>
      )}
    </div>
  );
}
