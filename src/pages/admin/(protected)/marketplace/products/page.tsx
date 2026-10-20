"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Truck } from "lucide-react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProductsAdmin,
  getShippingRates,
  updateCategory,
  updateProduct,
  updateShippingRates,
  uploadProductImages,
} from "@/lib/api/marketplace";
import { uploadImages } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import type { Category, Product, ShippingRate } from "@/lib/api/types";
import { FLAT_SHIPPING_FEE } from "@/lib/marketplace-config";
import { AdminField } from "@/components/admin/admin-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { categoriesInTreeOrder, categoryPath, isTopLevel, subcategoriesOf, topLevelCategories } from "@/lib/category-tree";
import { isRichTextEmpty } from "@/lib/rich-text";
import {
  draftToInput,
  EMPTY_VARIANT,
  validateVariantDrafts,
  VariantManager,
  VariantRowsEditor,
  type VariantDraft,
} from "@/components/admin/product-variants";
import { activeVariants, bestOfferOf, priceRange } from "@/lib/variants";
import { isRenderableImageSrc } from "@/lib/image";
import { StockTab } from "@/components/admin/marketplace/stock-tab";
import { OffersTab } from "@/components/admin/marketplace/offers-tab";

// "Get it within X–Y days" on the storefront, per product.
interface DeliveryEstimateDraft {
  enabled: boolean;
  min: string;
  max: string;
}

function deliveryDraftOf(product?: Product): DeliveryEstimateDraft {
  return {
    enabled: product?.deliveryEstimateEnabled ?? false,
    min: product?.deliveryMinDays != null ? String(product.deliveryMinDays) : "2",
    max: product?.deliveryMaxDays != null ? String(product.deliveryMaxDays) : "5",
  };
}

function deliveryInput(d: DeliveryEstimateDraft) {
  return {
    deliveryEstimateEnabled: d.enabled,
    deliveryMinDays: d.min === "" ? null : Number(d.min),
    deliveryMaxDays: d.max === "" ? null : Number(d.max),
  };
}

function DeliveryEstimateFields({
  value,
  onChange,
}: {
  value: DeliveryEstimateDraft;
  onChange: (value: DeliveryEstimateDraft) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={value.enabled} onChange={(e) => onChange({ ...value, enabled: e.target.checked })} />
        <Truck size={16} className="text-[#8DC63F]" />
        Show “Get it within…” delivery time in the shop
      </label>
      {value.enabled && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <AdminField label="Earliest (days)">
            <input
              type="number"
              min={0}
              max={365}
              value={value.min}
              onChange={(e) => onChange({ ...value, min: e.target.value })}
              className={`${ADMIN_INPUT} w-28`}
            />
          </AdminField>
          <AdminField label="Latest (days)">
            <input
              type="number"
              min={0}
              max={365}
              value={value.max}
              onChange={(e) => onChange({ ...value, max: e.target.value })}
              className={`${ADMIN_INPUT} w-28`}
            />
          </AdminField>
          <p className="pb-2 text-xs text-slate-400">
            Counted from the day the customer views the product, e.g. 2–5 shows “Get it between Wed 22 Oct – Sat 25 Oct”.
          </p>
        </div>
      )}
    </div>
  );
}

// Product category <select> options: each top-level category followed by
// its subcategories, indented. Products can be filed under either.
function CategoryOptions({ categories }: { categories: Category[] }) {
  return (
    <>
      {categoriesInTreeOrder(categories).map(({ category, depth }) => (
        <option key={category.id} value={category.id}>
          {depth === 1 ? `\u00A0\u00A0\u00A0↳ ${category.name}` : category.name}
        </option>
      ))}
    </>
  );
}

// Parent picker for the category forms. Only top-level categories can be
// parents (one level of nesting), and a category can't be its own parent.
function ParentCategorySelect({
  categories,
  value,
  onChange,
  excludeId,
  disabled,
}: {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  excludeId?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${ADMIN_SELECT} disabled:opacity-60`}
    >
      <option value="">None — this is a main category</option>
      {topLevelCategories(categories)
        .filter((c) => c.id !== excludeId)
        .map((c) => (
          <option key={c.id} value={c.id}>
            Subcategory of {c.name}
          </option>
        ))}
    </select>
  );
}

type Tab = "Products" | "Stock" | "Offers" | "Categories" | "Delivery charges";
const TABS: Tab[] = ["Products", "Stock", "Offers", "Categories", "Delivery charges"];

type ProductFilter = "all" | "low" | "out" | "offer" | "hidden";

/** "out" when nothing is left to sell, "low" when it's at/below its alert level. */
function productStockState(product: Product): "out" | "low" | "ok" {
  const variants = activeVariants(product);
  const levels = variants.length > 0 ? variants.map((v) => v.stockLevel) : [product.stockLevel];
  const known = levels.filter((l): l is NonNullable<typeof l> => !!l);
  if (known.length === 0 || known.every((l) => l.quantityOnHand <= 0)) return "out";
  if (known.some((l) => l.quantityOnHand <= l.lowStockThreshold)) return "low";
  return "ok";
}

export default function AdminProductsPage() {
  return (
    <RequireAdmin roles={["super_admin", "marketplace_manager"]}>
      <ProductsContent />
    </RequireAdmin>
  );
}

function ProductsContent() {
  const { authedFetch } = useAdminAuth();
  const [tab, setTab] = useState<Tab>("Products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getProductsAdmin(authedFetch), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // Standard fetch-on-mount: `load` itself synchronously flips
    // `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: products.length,
      low: products.filter((p) => productStockState(p) === "low").length,
      out: products.filter((p) => productStockState(p) === "out").length,
      offer: products.filter((p) => bestOfferOf(p)).length,
      hidden: products.filter((p) => !p.active).length,
    }),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "low" && productStockState(p) !== "low") return false;
      if (filter === "out" && productStockState(p) !== "out") return false;
      if (filter === "offer" && !bestOfferOf(p)) return false;
      if (filter === "hidden" && p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.variants ?? []).some((v) => v.sku.toLowerCase().includes(q) || v.name.toLowerCase().includes(q))
      );
    });
  }, [products, filter, query]);

  const chips: { key: ProductFilter; label: string; tone?: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "low", label: `Running low (${counts.low})`, tone: counts.low ? "text-amber-700" : undefined },
    { key: "out", label: `Out of stock (${counts.out})`, tone: counts.out ? "text-red-600" : undefined },
    { key: "offer", label: `On offer (${counts.offer})` },
    { key: "hidden", label: `Hidden (${counts.hidden})` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#153C4D]">Marketplace</h1>
        {tab === "Products" && (
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            disabled={categories.length === 0}
            className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-50"
          >
            {showCreateForm ? "Cancel" : "+ New Product"}
          </button>
        )}
        {tab === "Categories" && (
          <button
            type="button"
            onClick={() => setShowCategoryForm((v) => !v)}
            className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
          >
            {showCategoryForm ? "Cancel" : "+ New Category"}
          </button>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "border-[#153C4D] text-[#153C4D]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t}
            {t === "Stock" && counts.low + counts.out > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-800">
                {counts.low + counts.out}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {tab === "Products" && (
        <>
          {categories.length === 0 && !loading && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No categories exist yet — add one on the <strong>Categories</strong> tab before creating a product.
            </p>
          )}

          {showCreateForm && (
            <CreateProductForm
              categories={categories}
              onCreated={() => {
                setShowCreateForm(false);
                load();
              }}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  filter === c.key
                    ? "bg-[#153C4D] text-white"
                    : `bg-white shadow-sm hover:bg-slate-50 ${c.tone ?? "text-slate-600"}`
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
                aria-label="Search products"
                className={`${ADMIN_INPUT} pl-8`}
              />
            </div>
          </div>

          {loading && <p className="text-sm text-slate-500">Loading...</p>}

          {!loading && (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Shop</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                        {products.length === 0 ? "No products yet." : "No products match this filter."}
                      </td>
                    </tr>
                  )}
                  {visible.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      categories={categories}
                      editing={editingId === product.id}
                      onToggleEdit={() => setEditingId(editingId === product.id ? null : product.id)}
                      onOpenStock={() => setTab("Stock")}
                      onChanged={load}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "Stock" && <StockTab key={products.length} />}

      {tab === "Offers" && <OffersTab products={products} />}

      {tab === "Categories" && (
        <>
          {showCategoryForm && (
            <CreateCategoryForm
              categories={categories}
              featuredCount={categories.filter((c) => c.featured).length}
              onCreated={() => {
                setShowCategoryForm(false);
                load();
              }}
            />
          )}
          {categories.length > 0 ? (
            <CategoryList categories={categories} products={products} onChanged={load} />
          ) : (
            !loading && <p className="text-sm text-slate-400">No categories yet.</p>
          )}
        </>
      )}

      {tab === "Delivery charges" && <ShippingRatesSection />}
    </div>
  );
}

function ProductRow({
  product,
  categories,
  editing,
  onToggleEdit,
  onOpenStock,
  onChanged,
}: {
  product: Product;
  categories: Category[];
  editing: boolean;
  onToggleEdit: () => void;
  onOpenStock: () => void;
  onChanged: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const variants = product.variants ?? [];
  const stock = product.stockLevel;
  const range = priceRange(product);
  const offer = bestOfferOf(product);
  const state = productStockState(product);
  const variantTotal = activeVariants(product).reduce((sum, v) => sum + (v.stockLevel?.quantityOnHand ?? 0), 0);
  const image = [...product.images, ...variants.flatMap((v) => v.images ?? [])].find((src) => isRenderableImageSrc(src));

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(authedFetch, product.id);
      onChanged();
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <tr className={editing ? "bg-slate-50/60" : undefined}>
        <td className="border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {image && <Image src={image} alt="" fill sizes="44px" className="object-cover" />}
            </div>
            <div>
              <p className="font-semibold text-[#153C4D]">{product.name}</p>
              <p className="text-xs text-slate-400">
                {product.sku}
                {variants.length > 0 && ` · ${variants.length} option${variants.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
          {categoryPath(categories.find((c) => c.id === product.categoryId) ?? product.category, categories)}
        </td>
        <td className="border-t border-slate-100 px-4 py-3">
          <span className={`font-semibold ${offer ? "text-red-600" : "text-[#153C4D]"}`}>
            {range.min === range.max
              ? formatMoney(range.min, "usd")
              : `${formatMoney(range.min, "usd")} – ${formatMoney(range.max, "usd")}`}
          </span>
          {offer && (
            <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
              {offer.offerPercent}% off
            </span>
          )}
        </td>
        <td className="border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={onOpenStock} className="text-left hover:underline">
            <span
              className={
                state === "out"
                  ? "font-semibold text-red-600"
                  : state === "low"
                    ? "font-semibold text-amber-700"
                    : "text-slate-600"
              }
            >
              {variants.length > 0 ? variantTotal : (stock?.quantityOnHand ?? 0)} on hand
            </span>
            {state !== "ok" && (
              <span className="block text-xs font-normal text-slate-400">
                {state === "out" ? "Out of stock" : "Running low"}
              </span>
            )}
          </button>
        </td>
        <td className="border-t border-slate-100 px-4 py-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              product.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {product.active ? "Visible" : "Hidden"}
          </span>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onToggleEdit} className="text-xs font-semibold text-[#153C4D] hover:underline">
              {editing ? "Close" : "Edit"}
            </button>
            {confirmingDelete ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs font-semibold text-slate-400 hover:underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
      {confirmingDelete && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-red-50/60 px-4 py-2 text-xs text-red-700">
            Deleting removes “{product.name}” from the shop for good. Past orders keep their own record of its name,
            option and the price paid. To take it down temporarily, edit it and untick “Visible in the shop” instead.
          </td>
        </tr>
      )}
      {deleteError && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-700">{deleteError}</p>
          </td>
        </tr>
      )}
      {editing && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-slate-50/60 px-4 py-5">
            <EditProductForm product={product} categories={categories} onDone={onChanged} />
            <VariantManager product={product} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

function CategoryList({
  categories,
  products,
  onChanged,
}: {
  categories: Category[];
  products: Product[];
  onChanged: () => void;
}) {
  const featuredCount = categories.filter((c) => c.featured).length;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Products</th>
            <th className="px-4 py-3">Featured</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {categoriesInTreeOrder(categories).map(({ category, depth }) => (
            <CategoryRow
              key={category.id}
              category={category}
              categories={categories}
              depth={depth}
              productCount={products.filter((p) => p.categoryId === category.id).length}
              featuredCount={featuredCount}
              onChanged={onChanged}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryRow({
  category,
  categories,
  depth,
  productCount,
  featuredCount,
  onChanged,
}: {
  category: Category;
  categories: Category[];
  depth: 0 | 1;
  productCount: number;
  featuredCount: number;
  onChanged: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const subcategoryCount = depth === 0 ? subcategoriesOf(categories, category.id).length : 0;

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(authedFetch, category.id);
      onChanged();
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={4} className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
          <EditCategoryForm
            category={category}
            categories={categories}
            featuredCount={featuredCount}
            onDone={() => {
              setEditing(false);
              onChanged();
            }}
            onCancel={() => setEditing(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr>
        <td className={`border-t border-slate-100 py-3 pr-4 ${depth === 1 ? "pl-10" : "pl-4"}`}>
          <p className="font-semibold text-[#153C4D]">
            {depth === 1 && <span className="mr-1 text-slate-300">↳</span>}
            {category.name}
            {subcategoryCount > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {subcategoryCount} subcategor{subcategoryCount === 1 ? "y" : "ies"}
              </span>
            )}
          </p>
          {category.description && <p className="mt-0.5 text-xs text-slate-500">{category.description}</p>}
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{productCount}</td>
        <td className="border-t border-slate-100 px-4 py-3">
          {category.featured && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Featured
            </span>
          )}
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-right">
          <span className="flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-[#153C4D] hover:underline"
            >
              Edit
            </button>
            {confirmingDelete ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Confirm?"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs font-semibold text-slate-400 hover:underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </span>
        </td>
      </tr>
      {deleteError && (
        <tr>
          <td colSpan={4} className="border-t border-slate-100 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-700">{deleteError}</p>
          </td>
        </tr>
      )}
    </>
  );
}

const MAX_FEATURED_CATEGORIES = 4;

function EditCategoryForm({
  category,
  categories,
  featuredCount,
  onDone,
  onCancel,
}: {
  category: Category;
  categories: Category[];
  featuredCount: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [description, setDescription] = useState(category.description ?? "");
  const [imageUrl, setImageUrl] = useState<string[]>(category.imageUrl ? [category.imageUrl] : []);
  const [featured, setFeatured] = useState(Boolean(category.featured));
  const [parentId, setParentId] = useState(isTopLevel(category, categories) ? "" : (category.parentId ?? ""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A category that has subcategories of its own can't become one (only
  // one level of nesting).
  const hasChildren = subcategoriesOf(categories, category.id).length > 0;

  // Already-featured categories don't count against their own slot.
  const otherFeaturedCount = featuredCount - (category.featured ? 1 : 0);
  const featuredLimitReached = otherFeaturedCount >= MAX_FEATURED_CATEGORIES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateCategory(authedFetch, category.id, {
        description,
        imageUrl: imageUrl[0],
        featured,
        parentId: parentId || null,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <AdminField
        label="Parent category"
        help={
          hasChildren
            ? "This category has its own subcategories, so it has to stay a main category."
            : "Pick a main category to make this a subcategory of it."
        }
      >
        <ParentCategorySelect
          categories={categories}
          value={parentId}
          onChange={setParentId}
          excludeId={category.id}
          disabled={hasChildren}
        />
      </AdminField>
      <textarea
        placeholder="Short description shown on the homepage featured section"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={ADMIN_TEXTAREA}
      />
      <ImageDropzone
        images={imageUrl}
        onChange={setImageUrl}
        upload={(files) => uploadImages(authedFetch, files).then((r) => r.urls)}
        label="Category image"
        multiple={false}
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={featured}
          disabled={!featured && featuredLimitReached}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        Featured on homepage (max {MAX_FEATURED_CATEGORIES})
      </label>
      {!featured && featuredLimitReached && (
        <p className="text-xs text-amber-700">
          {MAX_FEATURED_CATEGORIES} categories are already featured — unfeature one first.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CreateCategoryForm({
  categories,
  featuredCount,
  onCreated,
}: {
  categories: Category[];
  featuredCount: number;
  onCreated: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [parentId, setParentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featuredLimitReached = featuredCount >= MAX_FEATURED_CATEGORIES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCategory(authedFetch, {
        name,
        slug: slug || undefined,
        description: description || undefined,
        imageUrl: imageUrl[0],
        featured,
        parentId: parentId || undefined,
      });
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl([]);
      setFeatured(false);
      setParentId("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create category");
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
          placeholder="e.g. Pantry"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          placeholder="Leave blank to generate from the name"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={ADMIN_INPUT}
        />
        <AdminField
          label="Parent category"
          className="sm:col-span-2"
          help="Leave as a main category, or pick one to add this as a subcategory under it (e.g. Pantry › Spices)."
        >
          <ParentCategorySelect categories={categories} value={parentId} onChange={setParentId} />
        </AdminField>
        <textarea
          placeholder="Short description shown on the homepage featured section"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${ADMIN_TEXTAREA} sm:col-span-2`}
        />
      </div>
      <div className="mt-3">
        <ImageDropzone
          images={imageUrl}
          onChange={setImageUrl}
          upload={(files) => uploadImages(authedFetch, files).then((r) => r.urls)}
          label="Category image"
          multiple={false}
        />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={featured}
          disabled={!featured && featuredLimitReached}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        Featured on homepage (max {MAX_FEATURED_CATEGORIES})
      </label>
      {!featured && featuredLimitReached && (
        <p className="mt-1 text-xs text-amber-700">
          {MAX_FEATURED_CATEGORIES} categories are already featured — unfeature one first.
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create Category"}
      </button>
    </form>
  );
}

// Weight-based shipping — admin sets a per-kg price for each whole kg from
// 1 to 15 (rates rarely scale linearly, so each band gets its own price).
// See BACKEND_CHANGES_SHIPPING_FLAT_BAND_PRICING.md. Each band holds the FLAT
// delivery price for an order of that weight — checkout looks up the band and
// charges it directly, with no multiplication (computeShippingFee in
// lib/shipping.ts).
const DEFAULT_SHIPPING_ROWS = Array.from({ length: 15 }, (_, i) => ({
  fromKg: i + 1,
  toKg: i + 1,
  price: 0,
}));

function ShippingRatesSection() {
  const { authedFetch } = useAdminAuth();
  const [rows, setRows] = useState<{ fromKg: number; toKg: number; price: number }[]>(DEFAULT_SHIPPING_ROWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getShippingRates()
      .then((rates) => {
        if (rates.length > 0) {
          setRows(
            [...rates]
              .sort((a, b) => a.fromKg - b.fromKg)
              .map((r) => ({ fromKg: r.fromKg, toKg: r.toKg, price: Number(r.price ?? r.pricePerKg ?? 0) }))
          );
        }
      })
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_PRICING_DISCOUNTS_SHIPPING.md is implemented."
            : null // any other failure just keeps the editable 1-15kg defaults
        )
      )
      .finally(() => setLoading(false));
  }, []);

  function updateRow(index: number, price: number) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, price } : r)));
    setSuccess(false);
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await updateShippingRates(authedFetch, rows);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save shipping rates");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Delivery Charges by Order Weight</h3>
      <p className="mt-1 text-xs text-slate-400">
        Set the <strong>total delivery charge</strong> for an order of each weight. At checkout we add up the
        cart&apos;s weight (each product&apos;s unit weight × quantity), round <strong>up</strong> to the next whole
        kilogram, and charge the matching band exactly as entered — it is not multiplied by the weight.
      </p>
      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Example: with 3kg set to <strong>9.99</strong>, an order weighing 2.4kg rounds up to 3kg and is charged{" "}
        <strong>$9.99</strong> delivery. Orders heavier than the last band you fill in are charged that band&apos;s
        price. Leave a band at 0 if you don&apos;t deliver that weight — bands left at 0 are skipped, and if every
        band is 0 we fall back to a flat ${FLAT_SHIPPING_FEE} delivery fee.
      </p>

      {error && <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">{error}</p>}
      {success && <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Shipping rates saved.</p>}
      {loading && <p className="mt-3 text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row, i) => (
            <label key={`${row.fromKg}-${row.toKg}`} className="flex flex-col gap-1 text-xs font-semibold text-slate-400">
              <span className="text-slate-500">
                Order weight {row.fromKg === row.toKg ? `${row.fromKg}kg` : `${row.fromKg}-${row.toKg}kg`}
              </span>
              <span className="font-normal normal-case text-slate-400">Delivery charge (USD)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                aria-label={`Delivery charge in US dollars for an order weighing ${row.fromKg}kg`}
                value={row.price}
                onChange={(e) => updateRow(i, Number(e.target.value))}
                className={ADMIN_INPUT}
              />
            </label>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={submitting || loading}
        className="mt-4 rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save Shipping Rates"}
      </button>
    </div>
  );
}

function ProductImageUploader({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const { authedFetch } = useAdminAuth();

  return (
    <div className="sm:col-span-2">
      <ImageDropzone
        images={images}
        onChange={onChange}
        upload={(files) => uploadProductImages(authedFetch, files).then((r) => r.urls)}
      />
    </div>
  );
}

function CreateProductForm({ categories, onCreated }: { categories: Category[]; onCreated: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [categoryId, setCategoryId] = useState(categoriesInTreeOrder(categories)[0]?.category.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [sku, setSku] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [weightKg, setWeightKg] = useState("");
  // Optional variations (e.g. 80ml / 100ml), each with its own SKU, price,
  // weight and stock — replacing the single price/stock/weight fields.
  const [delivery, setDelivery] = useState<DeliveryEstimateDraft>(deliveryDraftOf());
  const [withVariants, setWithVariants] = useState(false);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([{ ...EMPTY_VARIANT }, { ...EMPTY_VARIANT }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRichTextEmpty(description)) {
      setError("Please add a description.");
      return;
    }
    const variantProblem = withVariants ? validateVariantDrafts(variantDrafts) : null;
    if (variantProblem) {
      setError(variantProblem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const variants = withVariants ? variantDrafts.map(draftToInput) : undefined;
      await createProduct(authedFetch, {
        categoryId,
        name,
        description,
        // With variations the product price is the lowest variation price
        // (used for "From $X" and sorting); the backend recomputes it too.
        priceUsd: variants ? Math.min(...variants.map((v) => v.priceUsd)) : Number(priceUsd),
        images,
        sku,
        initialStock: variants ? 0 : Number(initialStock),
        lowStockThreshold: variants ? undefined : Number(lowStockThreshold),
        weightKg: variants ? undefined : weightKg ? Number(weightKg) : undefined,
        variants,
        ...deliveryInput(delivery),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField label="Category" required>
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={ADMIN_SELECT}>
            <option value="" disabled>
              Select category
            </option>
            <CategoryOptions categories={categories} />
          </select>
        </AdminField>
        <AdminField
          label="SKU"
          required
          help={withVariants ? "Code for the product as a whole; each variation also gets its own SKU below." : "Your own product code — must be unique."}
        >
          <input required placeholder="e.g. RAGU-250" value={sku} onChange={(e) => setSku(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Product name" required className="sm:col-span-2" help="Shown to customers in the shop and cart.">
          <input required placeholder="e.g. Ragù Bolognese" value={name} onChange={(e) => setName(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description<span className="ml-1 text-red-500">*</span>
          </span>
          <span className="text-xs font-normal text-slate-400">
            Shown in the product&apos;s detail window in the marketplace. Use the toolbar for bold, italic, underline
            and lists.
          </span>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            ariaLabel="Product description"
            placeholder="Describe the product — ingredients, size, how to use it..."
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          <input type="checkbox" checked={withVariants} onChange={(e) => setWithVariants(e.target.checked)} />
          This product comes in options (e.g. sizes like 80ml and 100ml)
        </label>
        {withVariants ? (
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs text-slate-400">
              Each variation is sold separately with its own SKU, price, weight and stock. Customers choose one in the
              product window.
            </p>
            <VariantRowsEditor drafts={variantDrafts} onChange={setVariantDrafts} />
          </div>
        ) : (
          <>
          <AdminField label="Price (USD)" required help="What the customer pays per unit.">
            <input required type="number" min={0} step="0.01" placeholder="0.00" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className={ADMIN_INPUT} />
          </AdminField>
          <AdminField label="Initial stock" required help="How many units you have right now.">
            <input required type="number" min={0} placeholder="0" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className={ADMIN_INPUT} />
          </AdminField>
          <AdminField label="Low stock alert at" help="Flags the product in this list once stock drops to this number.">
            <input type="number" min={0} placeholder="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className={ADMIN_INPUT} />
          </AdminField>
          <AdminField label="Weight per unit (kg)" help="Used to work out the delivery charge at checkout. Leave 0 if delivery is free.">
            <input type="number" min={0} step="0.01" placeholder="0.00" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className={ADMIN_INPUT} />
          </AdminField>
          </>
        )}
        <DeliveryEstimateFields value={delivery} onChange={setDelivery} />
        <ProductImageUploader images={images} onChange={setImages} />
      </div>
      <button
        type="submit"
        disabled={submitting || !categoryId}
        className="mt-4 rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}

function EditProductForm({
  product,
  categories,
  onDone,
}: {
  product: Product;
  categories: Category[];
  onDone: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [categoryId, setCategoryId] = useState(product.category.id);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceUsd, setPriceUsd] = useState(product.priceUsd);
  const [images, setImages] = useState<string[]>(product.images);
  const [active, setActive] = useState(product.active);
  const [weightKg, setWeightKg] = useState(product.weightKg ?? "");
  const [delivery, setDelivery] = useState<DeliveryEstimateDraft>(deliveryDraftOf(product));
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Price and weight are set per variation once a product has any.
  const variantPriced = (product.variants ?? []).length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRichTextEmpty(description)) {
      setError("Please add a description.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateProduct(authedFetch, product.id, {
        categoryId,
        name,
        description,
        priceUsd: variantPriced ? undefined : Number(priceUsd),
        images,
        active,
        weightKg: variantPriced ? undefined : weightKg !== "" ? Number(weightKg) : undefined,
        ...deliveryInput(delivery),
      });
      setSaved(true);
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#153C4D]">Product details</h4>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField label="Category">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={ADMIN_SELECT}>
            <CategoryOptions categories={categories} />
          </select>
        </AdminField>
        <AdminField label="Product name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        {variantPriced ? (
          <p className="rounded-xl bg-white px-4 py-2 text-xs text-slate-500 sm:col-span-2">
            Price and weight are set per option below.
          </p>
        ) : (
          <>
            <AdminField label="Price (USD)" help="Regular price — put it on sale from the Offers tab.">
              <input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className={ADMIN_INPUT} />
            </AdminField>
            <AdminField label="Weight per unit (kg)" help="Used for the delivery charge.">
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className={ADMIN_INPUT}
              />
            </AdminField>
          </>
        )}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
          <RichTextEditor value={description} onChange={setDescription} ariaLabel="Product description" />
        </div>
        <DeliveryEstimateFields value={delivery} onChange={setDelivery} />
        <ProductImageUploader images={images} onChange={setImages} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Visible in the shop
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save details"}
        </button>
        {saved && !submitting && <span className="text-xs text-emerald-700">Saved.</span>}
      </div>
    </form>
  );
}
