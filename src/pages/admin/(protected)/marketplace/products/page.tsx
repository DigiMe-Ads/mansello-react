"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import {
  adjustStock,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProductsAdmin,
  getShippingRates,
  listLowStock,
  updateCategory,
  updateProduct,
  updateShippingRates,
  uploadProductImages,
} from "@/lib/api/marketplace";
import { uploadImages } from "@/lib/api/uploads";
import { ApiRequestError, isConflict } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import type { Category, LowStockItem, Product, ShippingRate } from "@/lib/api/types";
import { FLAT_SHIPPING_FEE } from "@/lib/marketplace-config";
import { AdminField } from "@/components/admin/admin-field";

export default function AdminProductsPage() {
  return (
    <RequireAdmin roles={["super_admin", "marketplace_manager"]}>
      <ProductsContent />
    </RequireAdmin>
  );
}

function ProductsContent() {
  const { authedFetch } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getProductsAdmin(authedFetch), getCategories(), listLowStock(authedFetch)])
      .then(([prods, cats, low]) => {
        setProducts(prods);
        setCategories(cats);
        setLowStock(low);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#153C4D]">Products</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryForm((v) => !v)}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {showCategoryForm ? "Cancel" : "+ New Category"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
          >
            {showCreateForm ? "Cancel" : "+ New Product"}
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <CreateCategoryForm
          featuredCount={categories.filter((c) => c.featured).length}
          onCreated={() => {
            setShowCategoryForm(false);
            load();
          }}
        />
      )}

      {categories.length > 0 && (
        <CategoryList
          categories={categories}
          products={products}
          onChanged={load}
        />
      )}

      {categories.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No categories exist yet — click &quot;+ New Category&quot; above before creating a product.
        </p>
      )}

      <ShippingRatesSection />

      {lowStock.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Low stock ({lowStock.length})</p>
          <p className="mt-1 text-xs text-amber-700">
            {lowStock.map((item) => item.product.name).join(", ")}
          </p>
        </div>
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

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    No products yet.
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categories={categories}
                  editing={editingId === product.id}
                  adjusting={adjustingId === product.id}
                  onToggleEdit={() => setEditingId(editingId === product.id ? null : product.id)}
                  onToggleAdjust={() => setAdjustingId(adjustingId === product.id ? null : product.id)}
                  onChanged={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  product,
  categories,
  editing,
  adjusting,
  onToggleEdit,
  onToggleAdjust,
  onChanged,
}: {
  product: Product;
  categories: Category[];
  editing: boolean;
  adjusting: boolean;
  onToggleEdit: () => void;
  onToggleAdjust: () => void;
  onChanged: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const stock = product.stockLevel;
  const lowStock = stock && stock.quantityOnHand <= stock.lowStockThreshold;

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [blockedByOrders, setBlockedByOrders] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(authedFetch, product.id);
      onChanged();
    } catch (err) {
      setConfirmingDelete(false);
      setBlockedByOrders(isConflict(err));
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeactivateInstead() {
    setDeleting(true);
    try {
      await updateProduct(authedFetch, product.id, { active: false });
      setDeleteError(null);
      onChanged();
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to deactivate product");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <tr>
        <td className="border-t border-slate-100 px-4 py-3">
          <p className="font-semibold text-[#153C4D]">{product.name}</p>
          <p className="text-xs text-slate-400">{product.sku}</p>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{product.category.name}</td>
        <td className="border-t border-slate-100 px-4 py-3 font-semibold text-[#153C4D]">
          {formatMoney(product.priceUsd, "usd")}
        </td>
        <td className={`border-t border-slate-100 px-4 py-3 ${lowStock ? "font-semibold text-amber-700" : "text-slate-600"}`}>
          {stock ? `${stock.quantityOnHand} on hand` : "—"}
        </td>
        <td className="border-t border-slate-100 px-4 py-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              product.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {product.active ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-right">
          <div className="flex justify-end items-center gap-3">
            <button type="button" onClick={onToggleAdjust} className="text-xs font-semibold text-[#153C4D] hover:underline">
              Stock
            </button>
            <button type="button" onClick={onToggleEdit} className="text-xs font-semibold text-[#153C4D] hover:underline">
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
          </div>
        </td>
      </tr>
      {deleteError && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-700">{deleteError}</p>
            {blockedByOrders && (
              <button
                type="button"
                onClick={handleDeactivateInstead}
                disabled={deleting}
                className="mt-2 text-xs font-semibold text-[#153C4D] hover:underline disabled:opacity-60"
              >
                {deleting ? "Deactivating..." : "Deactivate instead"}
              </button>
            )}
          </td>
        </tr>
      )}
      {adjusting && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
            <StockAdjustForm productId={product.id} onDone={onChanged} />
          </td>
        </tr>
      )}
      {editing && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
            <EditProductForm product={product} categories={categories} onDone={onChanged} />
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
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              productCount={products.filter((p) => p.category.id === category.id).length}
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
  productCount,
  featuredCount,
  onChanged,
}: {
  category: Category;
  productCount: number;
  featuredCount: number;
  onChanged: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        <td className="border-t border-slate-100 px-4 py-3">
          <p className="font-semibold text-[#153C4D]">{category.name}</p>
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
  featuredCount,
  onDone,
  onCancel,
}: {
  category: Category;
  featuredCount: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [description, setDescription] = useState(category.description ?? "");
  const [imageUrl, setImageUrl] = useState<string[]>(category.imageUrl ? [category.imageUrl] : []);
  const [featured, setFeatured] = useState(Boolean(category.featured));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

function CreateCategoryForm({ featuredCount, onCreated }: { featuredCount: number; onCreated: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
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
      });
      setName("");
      setSlug("");
      setDescription("");
      setImageUrl([]);
      setFeatured(false);
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
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [sku, setSku] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [weightKg, setWeightKg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createProduct(authedFetch, {
        categoryId,
        name,
        description,
        priceUsd: Number(priceUsd),
        images,
        sku,
        initialStock: Number(initialStock),
        lowStockThreshold: Number(lowStockThreshold),
        weightKg: weightKg ? Number(weightKg) : undefined,
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
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={ADMIN_SELECT}>
          <option value="" disabled>
            Select category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <AdminField label="SKU" required help="Your own product code — must be unique.">
          <input required placeholder="e.g. RAGU-250" value={sku} onChange={(e) => setSku(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Product name" required className="sm:col-span-2" help="Shown to customers in the shop and cart.">
          <input required placeholder="e.g. Ragù Bolognese" value={name} onChange={(e) => setName(e.target.value)} className={ADMIN_INPUT} />
        </AdminField>
        <AdminField label="Description" required className="sm:col-span-2" help="Shown on the product card in the marketplace.">
          <textarea required rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={ADMIN_TEXTAREA} />
        </AdminField>
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateProduct(authedFetch, product.id, {
        categoryId,
        name,
        description,
        priceUsd: Number(priceUsd),
        images,
        active,
        weightKg: weightKg !== "" ? Number(weightKg) : undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={ADMIN_SELECT}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} className={ADMIN_INPUT} />
        <input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className={ADMIN_INPUT} />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Weight per unit (kg)"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          className={ADMIN_INPUT}
        />
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${ADMIN_TEXTAREA} sm:col-span-2`} />
        <ProductImageUploader images={images} onChange={setImages} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (visible in the storefront)
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function StockAdjustForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [delta, setDelta] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!delta) return;
    setSubmitting(true);
    setError(null);
    try {
      await adjustStock(authedFetch, productId, Number(delta));
      setDelta("");
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      {error && <p className="text-xs text-red-700">{error}</p>}
      <input
        type="number"
        placeholder="Delta (e.g. 10 or -3)"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        className={ADMIN_INPUT}
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[#153C4D] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Applying..." : "Apply"}
      </button>
    </form>
  );
}
