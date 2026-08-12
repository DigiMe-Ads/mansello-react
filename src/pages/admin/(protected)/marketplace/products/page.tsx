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
  getCategories,
  getProducts,
  listLowStock,
  updateProduct,
  uploadProductImages,
} from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import type { Category, LowStockItem, Product } from "@/lib/api/types";

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
    Promise.all([getProducts(), getCategories(), listLowStock(authedFetch)])
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
          onCreated={() => {
            setShowCategoryForm(false);
            load();
          }}
        />
      )}

      {categories.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No categories exist yet — click &quot;+ New Category&quot; above before creating a product.
        </p>
      )}

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
                    No active products yet.
                  </td>
                </tr>
              )}
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
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
  editing,
  adjusting,
  onToggleEdit,
  onToggleAdjust,
  onChanged,
}: {
  product: Product;
  editing: boolean;
  adjusting: boolean;
  onToggleEdit: () => void;
  onToggleAdjust: () => void;
  onChanged: () => void;
}) {
  const stock = product.stockLevel;
  const lowStock = stock && stock.quantityOnHand <= stock.lowStockThreshold;

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
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onToggleAdjust} className="text-xs font-semibold text-[#153C4D] hover:underline">
              Stock
            </button>
            <button type="button" onClick={onToggleEdit} className="text-xs font-semibold text-[#153C4D] hover:underline">
              Edit
            </button>
          </div>
        </td>
      </tr>
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
            <EditProductForm product={product} onDone={onChanged} />
          </td>
        </tr>
      )}
    </>
  );
}

function CreateCategoryForm({ onCreated }: { onCreated: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createCategory(authedFetch, { name, slug: slug || undefined });
      setName("");
      setSlug("");
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
      <div className="flex flex-wrap items-center gap-3">
        <input
          required
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          placeholder="Slug (optional, derived from name)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={ADMIN_INPUT}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Category"}
        </button>
      </div>
    </form>
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
        <input required placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} className={ADMIN_INPUT} />
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={`${ADMIN_INPUT} sm:col-span-2`} />
        <textarea required placeholder="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${ADMIN_TEXTAREA} sm:col-span-2`} />
        <input required type="number" min={0} step="0.01" placeholder="Price (USD)" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className={ADMIN_INPUT} />
        <input required type="number" min={0} placeholder="Initial stock" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className={ADMIN_INPUT} />
        <input type="number" min={0} placeholder="Low stock threshold" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className={ADMIN_INPUT} />
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

function EditProductForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [priceUsd, setPriceUsd] = useState(product.priceUsd);
  const [images, setImages] = useState<string[]>(product.images);
  const [active, setActive] = useState(product.active);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateProduct(authedFetch, product.id, {
        name,
        description,
        priceUsd: Number(priceUsd),
        images,
        active,
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
        <input value={name} onChange={(e) => setName(e.target.value)} className={ADMIN_INPUT} />
        <input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className={ADMIN_INPUT} />
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
