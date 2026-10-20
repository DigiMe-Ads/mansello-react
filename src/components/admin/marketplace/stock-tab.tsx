"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import { listStock, setStockLevel } from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { isRenderableImageSrc } from "@/lib/image";
import type { StockRow } from "@/lib/api/types";

// Every sellable item (a plain product, or each option of one) in one list,
// with the counted quantity and alert level editable in place. Type the new
// numbers, then Save — one row, or every changed row at once.

export type StockFilter = "all" | "low" | "out";

export function stockState(row: { stockLevel: { quantityOnHand: number; lowStockThreshold: number } }) {
  const { quantityOnHand, lowStockThreshold } = row.stockLevel;
  if (quantityOnHand <= 0) return "out" as const;
  if (quantityOnHand <= lowStockThreshold) return "low" as const;
  return "ok" as const;
}

const STATE_BADGE = {
  out: "bg-red-100 text-red-700",
  low: "bg-amber-100 text-amber-800",
  ok: "bg-emerald-100 text-emerald-700",
};
const STATE_LABEL = { out: "Out of stock", low: "Low stock", ok: "In stock" };

type Draft = { quantityOnHand: string; lowStockThreshold: string };

export function StockTab({ initialFilter = "all" }: { initialFilter?: StockFilter }) {
  const { authedFetch } = useAdminAuth();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [filter, setFilter] = useState<StockFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listStock(authedFetch)
      .then((r) => {
        setRows(r);
        setDrafts({});
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stock"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      low: rows.filter((r) => stockState(r) === "low").length,
      out: rows.filter((r) => stockState(r) === "out").length,
    }),
    [rows]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => filter === "all" || stockState(r) === filter)
      .filter(
        (r) =>
          !q ||
          r.productName.toLowerCase().includes(q) ||
          (r.variantName ?? "").toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q)
      )
      // Most urgent first: out, then low, then the rest by quantity.
      .sort((a, b) => {
        const order = { out: 0, low: 1, ok: 2 };
        return order[stockState(a)] - order[stockState(b)] || a.stockLevel.quantityOnHand - b.stockLevel.quantityOnHand;
      });
  }, [rows, filter, query]);

  function draftOf(row: StockRow): Draft {
    return (
      drafts[row.stockLevel.id] ?? {
        quantityOnHand: String(row.stockLevel.quantityOnHand),
        lowStockThreshold: String(row.stockLevel.lowStockThreshold),
      }
    );
  }

  function changesOf(row: StockRow) {
    const d = drafts[row.stockLevel.id];
    if (!d) return null;
    const change: { quantityOnHand?: number; lowStockThreshold?: number } = {};
    if (d.quantityOnHand !== "" && Number(d.quantityOnHand) !== row.stockLevel.quantityOnHand)
      change.quantityOnHand = Number(d.quantityOnHand);
    if (d.lowStockThreshold !== "" && Number(d.lowStockThreshold) !== row.stockLevel.lowStockThreshold)
      change.lowStockThreshold = Number(d.lowStockThreshold);
    return Object.keys(change).length ? change : null;
  }

  const dirty = rows.filter((r) => changesOf(r));

  async function save(targets: StockRow[]) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      for (const row of targets) {
        const change = changesOf(row);
        if (change) await setStockLevel(authedFetch, row.stockLevel.id, change);
      }
      setNotice(`Saved ${targets.length} item${targets.length === 1 ? "" : "s"}.`);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save stock");
    } finally {
      setSaving(false);
    }
  }

  function setDraft(row: StockRow, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [row.stockLevel.id]: { ...draftOf(row), ...patch } }));
    setNotice(null);
  }

  const chips: { key: StockFilter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "low", label: `Running low (${counts.low})` },
    { key: "out", label: `Out of stock (${counts.out})` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Type the quantity you actually have on the shelf, then save. Items are flagged as{" "}
        <strong>running low</strong> once they drop to their alert level. Products with options (sizes etc.) are listed
        once per option.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === c.key ? "bg-[#153C4D] text-white" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or SKU"
            aria-label="Search stock"
            className={`${ADMIN_INPUT} pl-8`}
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Alert at</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    {filter === "all" ? "No items match." : "Nothing here — good news."}
                  </td>
                </tr>
              )}
              {visible.map((row) => {
                const state = stockState(row);
                const d = draftOf(row);
                const changed = changesOf(row) !== null;
                const hidden = !row.productActive || !row.variantActive;
                return (
                  <tr key={row.stockLevel.id} className={hidden ? "opacity-60" : undefined}>
                    <td className="border-t border-slate-100 px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          {isRenderableImageSrc(row.image) && (
                            <Image src={row.image} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#153C4D]">{row.productName}</p>
                          <p className="text-xs text-slate-400">
                            {row.variantName ? `Option: ${row.variantName}` : row.categoryName}
                            {hidden && " · hidden from shop"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">{row.sku}</td>
                    <td className="border-t border-slate-100 px-4 py-2">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATE_BADGE[state]}`}>
                        {STATE_LABEL[state]}
                      </span>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        aria-label={`Quantity on hand for ${row.productName} ${row.variantName ?? ""}`}
                        value={d.quantityOnHand}
                        onChange={(e) => setDraft(row, { quantityOnHand: e.target.value })}
                        className={`${ADMIN_INPUT} w-24`}
                      />
                    </td>
                    <td className="border-t border-slate-100 px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        aria-label={`Low stock alert level for ${row.productName} ${row.variantName ?? ""}`}
                        value={d.lowStockThreshold}
                        onChange={(e) => setDraft(row, { lowStockThreshold: e.target.value })}
                        className={`${ADMIN_INPUT} w-20`}
                      />
                    </td>
                    <td className="border-t border-slate-100 px-4 py-2 text-right">
                      <button
                        type="button"
                        disabled={!changed || saving}
                        onClick={() => save([row])}
                        className="rounded-full bg-[#153C4D] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-30"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dirty.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-[#153C4D] px-5 py-3 text-sm text-white shadow-lg">
          <span>
            {dirty.length} unsaved change{dirty.length === 1 ? "" : "s"}
          </span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDrafts({})} className="font-semibold text-white/70 hover:text-white">
              Discard
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save(dirty)}
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
