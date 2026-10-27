"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { updateProduct, updateProductVariant } from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { categoriesInTreeOrder } from "@/lib/category-tree";
import { isRenderableImageSrc } from "@/lib/image";
import type { Category, Product, ProductVariant } from "@/lib/api/types";

// Spreadsheet-style editing of many products at once: name, category,
// price, weight, shop visibility and delivery time per product, and price,
// weight and visibility per option. Changed cells are highlighted; "Save
// all" sends only what changed. Descriptions and photos stay in the full
// Edit panel ("Edit details" on each row).

const CELL =
  "w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-800 hover:border-slate-200 focus:border-[#153C4D] focus:bg-white focus:outline-none";
const CHANGED = "!border-amber-300 !bg-amber-50";

type ProductDraft = {
  name: string;
  categoryId: string;
  priceUsd: string;
  weightKg: string;
  active: string; // "true" | "false"
  delivery: string; // "off" | "min-max"
};

type VariantDraft = { priceUsd: string; weightKg: string; active: string };

const DELIVERY_PRESETS = ["off", "0-1", "1-2", "1-3", "2-4", "2-5", "3-5", "3-7", "5-10", "7-14", "14-21"];

function deliveryOf(p: Product) {
  return p.deliveryEstimateEnabled && p.deliveryMinDays != null && p.deliveryMaxDays != null
    ? `${p.deliveryMinDays}-${p.deliveryMaxDays}`
    : "off";
}

function productDraft(p: Product): ProductDraft {
  return {
    name: p.name,
    categoryId: p.categoryId,
    priceUsd: String(Number(p.priceUsd)),
    weightKg: p.weightKg != null ? String(Number(p.weightKg)) : "",
    active: String(p.active),
    delivery: deliveryOf(p),
  };
}

function variantDraft(v: ProductVariant): VariantDraft {
  return {
    priceUsd: String(Number(v.priceUsd)),
    weightKg: v.weightKg != null ? String(Number(v.weightKg)) : "",
    active: String(v.active),
  };
}

export function BulkEditTable({
  products,
  categories,
  onOpenDetails,
  onSaved,
}: {
  products: Product[];
  categories: Category[];
  onOpenDetails: (productId: string) => void;
  onSaved: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [pDrafts, setPDrafts] = useState<Record<string, ProductDraft>>({});
  const [vDrafts, setVDrafts] = useState<Record<string, VariantDraft>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const categoryOptions = useMemo(() => categoriesInTreeOrder(categories), [categories]);
  const variantsOf = (p: Product) => [...(p.variants ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const pd = (p: Product) => pDrafts[p.id] ?? productDraft(p);
  const vd = (v: ProductVariant) => vDrafts[v.id] ?? variantDraft(v);

  function pChanged(p: Product, field: keyof ProductDraft) {
    const d = pDrafts[p.id];
    return !!d && d[field] !== productDraft(p)[field];
  }
  function vChanged(v: ProductVariant, field: keyof VariantDraft) {
    const d = vDrafts[v.id];
    return !!d && d[field] !== variantDraft(v)[field];
  }

  const setP = (p: Product, patch: Partial<ProductDraft>) => {
    setNotice(null);
    setPDrafts((prev) => ({ ...prev, [p.id]: { ...pd(p), ...patch } }));
  };
  const setV = (v: ProductVariant, patch: Partial<VariantDraft>) => {
    setNotice(null);
    setVDrafts((prev) => ({ ...prev, [v.id]: { ...vd(v), ...patch } }));
  };

  const changedProducts = products.filter((p) => (Object.keys(productDraft(p)) as (keyof ProductDraft)[]).some((f) => pChanged(p, f)));
  const changedVariants = products.flatMap((p) =>
    variantsOf(p)
      .filter((v) => (Object.keys(variantDraft(v)) as (keyof VariantDraft)[]).some((f) => vChanged(v, f)))
      .map((v) => ({ product: p, variant: v }))
  );
  const changeCount = changedProducts.length + changedVariants.length;

  function validate(): string | null {
    for (const p of changedProducts) {
      const d = pd(p);
      if (!d.name.trim()) return `“${p.name}” needs a name.`;
      if (!(variantsOf(p).length > 0) && (d.priceUsd === "" || Number(d.priceUsd) < 0)) return `“${d.name}” needs a price.`;
    }
    for (const { variant } of changedVariants) {
      if (vd(variant).priceUsd === "" || Number(vd(variant).priceUsd) < 0) return `Option “${variant.name}” needs a price.`;
    }
    return null;
  }

  async function saveAll() {
    const problem = validate();
    if (problem) {
      setErrors([problem]);
      return;
    }
    setSaving(true);
    setErrors([]);
    setNotice(null);
    const failed: string[] = [];
    let done = 0;
    const total = changeCount;

    for (const p of changedProducts) {
      const d = pd(p);
      const original = productDraft(p);
      const hasOptions = variantsOf(p).length > 0;
      const [min, max] = d.delivery === "off" ? [null, null] : d.delivery.split("-").map(Number);
      setProgress(`Saving ${++done} of ${total}…`);
      try {
        await updateProduct(authedFetch, p.id, {
          ...(d.name !== original.name ? { name: d.name.trim() } : {}),
          ...(d.categoryId !== original.categoryId ? { categoryId: d.categoryId } : {}),
          ...(!hasOptions && d.priceUsd !== original.priceUsd ? { priceUsd: Number(d.priceUsd) } : {}),
          ...(!hasOptions && d.weightKg !== original.weightKg && d.weightKg !== "" ? { weightKg: Number(d.weightKg) } : {}),
          ...(d.active !== original.active ? { active: d.active === "true" } : {}),
          ...(d.delivery !== original.delivery
            ? { deliveryEstimateEnabled: d.delivery !== "off", ...(min != null ? { deliveryMinDays: min, deliveryMaxDays: max } : {}) }
            : {}),
        });
        setPDrafts((prev) => {
          const next = { ...prev };
          delete next[p.id];
          return next;
        });
      } catch (err) {
        failed.push(`${p.name}: ${err instanceof ApiRequestError ? err.message : "failed to save"}`);
      }
    }

    for (const { product, variant } of changedVariants) {
      const d = vd(variant);
      const original = variantDraft(variant);
      setProgress(`Saving ${++done} of ${total}…`);
      try {
        await updateProductVariant(authedFetch, product.id, variant.id, {
          ...(d.priceUsd !== original.priceUsd ? { priceUsd: Number(d.priceUsd) } : {}),
          ...(d.weightKg !== original.weightKg && d.weightKg !== "" ? { weightKg: Number(d.weightKg) } : {}),
          ...(d.active !== original.active ? { active: d.active === "true" } : {}),
        });
        setVDrafts((prev) => {
          const next = { ...prev };
          delete next[variant.id];
          return next;
        });
      } catch (err) {
        failed.push(`${product.name} (${variant.name}): ${err instanceof ApiRequestError ? err.message : "failed to save"}`);
      }
    }

    setProgress(null);
    setSaving(false);
    setErrors(failed);
    if (failed.length < total) setNotice(`Saved ${total - failed.length} change${total - failed.length === 1 ? "" : "s"}.`);
    onSaved();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        Click any cell to change it — changed cells turn yellow. Nothing is saved until you press{" "}
        <strong>Save all</strong>. Products with options are priced per option: open the arrow to edit them. For the
        description and photos, use <strong>Edit details</strong>.
      </p>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
      {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="w-8 px-2 py-3" />
              <th className="min-w-[320px] px-2 py-3">Product</th>
              <th className="px-2 py-3">Category</th>
              <th className="w-28 px-2 py-3">Price (USD)</th>
              <th className="w-24 px-2 py-3">Weight (kg)</th>
              <th className="w-28 px-2 py-3">Shop</th>
              <th className="w-32 px-2 py-3">Delivery time</th>
              <th className="w-28 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                  No products match this filter.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const d = pd(p);
              const options = variantsOf(p);
              const open = expanded[p.id];
              const image = p.images.find((src) => isRenderableImageSrc(src));
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td className="border-t border-slate-100 px-2 py-1.5 text-center">
                      {options.length > 0 && (
                        <button
                          type="button"
                          aria-label={open ? "Hide options" : "Show options"}
                          onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !open }))}
                          className="text-slate-400 hover:text-[#153C4D]"
                        >
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      )}
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-slate-100">
                          {image && <Image src={image} alt="" fill sizes="32px" className="object-cover" />}
                        </div>
                        <input
                          aria-label="Product name"
                          value={d.name}
                          onChange={(e) => setP(p, { name: e.target.value })}
                          className={`${CELL} font-semibold text-[#153C4D] ${pChanged(p, "name") ? CHANGED : ""}`}
                        />
                      </div>
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5">
                      <select
                        aria-label="Category"
                        value={d.categoryId}
                        onChange={(e) => setP(p, { categoryId: e.target.value })}
                        className={`${CELL} ${pChanged(p, "categoryId") ? CHANGED : ""}`}
                      >
                        {categoryOptions.map(({ category, depth }) => (
                          <option key={category.id} value={category.id}>
                            {depth === 1 ? `  ↳ ${category.name}` : category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5">
                      {options.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: true }))}
                          className="px-2 text-xs text-slate-400 hover:underline"
                        >
                          per option ({options.length})
                        </button>
                      ) : (
                        <input
                          aria-label="Price"
                          type="number"
                          min={0}
                          step="0.01"
                          value={d.priceUsd}
                          onChange={(e) => setP(p, { priceUsd: e.target.value })}
                          className={`${CELL} ${pChanged(p, "priceUsd") ? CHANGED : ""}`}
                        />
                      )}
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5">
                      {options.length > 0 ? (
                        <span className="px-2 text-xs text-slate-400">per option</span>
                      ) : (
                        <input
                          aria-label="Weight in kg"
                          type="number"
                          min={0}
                          step="0.01"
                          value={d.weightKg}
                          placeholder="0"
                          onChange={(e) => setP(p, { weightKg: e.target.value })}
                          className={`${CELL} ${pChanged(p, "weightKg") ? CHANGED : ""}`}
                        />
                      )}
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5">
                      <select
                        aria-label="Shown in shop"
                        value={d.active}
                        onChange={(e) => setP(p, { active: e.target.value })}
                        className={`${CELL} ${d.active === "true" ? "text-emerald-700" : "text-slate-500"} ${pChanged(p, "active") ? CHANGED : ""}`}
                      >
                        <option value="true">Visible</option>
                        <option value="false">Hidden</option>
                      </select>
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5">
                      <select
                        aria-label="Delivery time"
                        value={d.delivery}
                        onChange={(e) => setP(p, { delivery: e.target.value })}
                        className={`${CELL} ${pChanged(p, "delivery") ? CHANGED : ""}`}
                      >
                        {[...new Set([...DELIVERY_PRESETS, deliveryOf(p)])].map((v) => (
                          <option key={v} value={v}>
                            {v === "off" ? "Not shown" : `${v.replace("-", "–")} days`}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-t border-slate-100 px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(p.id)}
                        className="whitespace-nowrap text-xs font-semibold text-[#153C4D] hover:underline"
                      >
                        Edit details
                      </button>
                    </td>
                  </tr>
                  {open &&
                    options.map((v) => {
                      const vdft = vd(v);
                      return (
                        <tr key={v.id} className="bg-slate-50/70">
                          <td className="border-t border-slate-100" />
                          <td className="border-t border-slate-100 py-1.5 pl-12 pr-2 text-xs text-slate-600">
                            <span className="mr-1 text-slate-300">↳</span>
                            {v.name}
                            <span className="ml-2 text-slate-400">{v.sku}</span>
                          </td>
                          <td className="border-t border-slate-100 px-2 py-1.5 text-xs text-slate-400">
                            {v.stockLevel ? `${v.stockLevel.quantityOnHand} in stock` : ""}
                          </td>
                          <td className="border-t border-slate-100 px-2 py-1.5">
                            <input
                              aria-label={`Price of ${v.name}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={vdft.priceUsd}
                              onChange={(e) => setV(v, { priceUsd: e.target.value })}
                              className={`${CELL} ${vChanged(v, "priceUsd") ? CHANGED : ""}`}
                            />
                          </td>
                          <td className="border-t border-slate-100 px-2 py-1.5">
                            <input
                              aria-label={`Weight of ${v.name} in kg`}
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0"
                              value={vdft.weightKg}
                              onChange={(e) => setV(v, { weightKg: e.target.value })}
                              className={`${CELL} ${vChanged(v, "weightKg") ? CHANGED : ""}`}
                            />
                          </td>
                          <td className="border-t border-slate-100 px-2 py-1.5">
                            <select
                              aria-label={`Show ${v.name} in shop`}
                              value={vdft.active}
                              onChange={(e) => setV(v, { active: e.target.value })}
                              className={`${CELL} ${vdft.active === "true" ? "text-emerald-700" : "text-slate-500"} ${vChanged(v, "active") ? CHANGED : ""}`}
                            >
                              <option value="true">Visible</option>
                              <option value="false">Hidden</option>
                            </select>
                          </td>
                          <td className="border-t border-slate-100" colSpan={2} />
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {changeCount > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-[#153C4D] px-5 py-3 text-sm text-white shadow-lg">
          <span>
            {progress ?? `${changeCount} unsaved change${changeCount === 1 ? "" : "s"}`}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setPDrafts({});
                setVDrafts({});
                setErrors([]);
              }}
              className="font-semibold text-white/70 hover:text-white disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveAll}
              className="rounded-full bg-[#8DC63F] px-5 py-1.5 font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save all"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
