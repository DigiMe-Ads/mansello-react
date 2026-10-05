"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_SELECT } from "@/components/admin/input-styles";
import { StarRating } from "@/components/marketplace/product-detail-dialog";
import { deleteProductReview, getProductReviews, getProductsAdmin } from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { formatDisplayDate } from "@/lib/date";
import type { Product, ProductReview } from "@/lib/api/types";

export default function AdminReviewsPage() {
  return (
    <RequireAdmin roles={["super_admin", "marketplace_manager"]}>
      <ReviewsContent />
    </RequireAdmin>
  );
}

type RatingFilter = "all" | "low";

function ReviewsContent() {
  const { authedFetch } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [productFilter, setProductFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The backend only lists reviews per product (the public
  // GET /catalog/products/:id/reviews), so fetch each product's and merge
  // them into one newest-first list. A product whose reviews fail to load
  // (e.g. it's inactive, which that public endpoint 404s on) is skipped
  // rather than failing the whole page.
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getProductsAdmin(authedFetch)
      .then(async (prods) => {
        setProducts(prods);
        const perProduct = await Promise.all(prods.map((p) => getProductReviews(p.id).catch(() => [])));
        setReviews(perProduct.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // Standard fetch-on-mount: `load` itself synchronously flips
    // `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Unknown product";

  const visible = reviews.filter(
    (r) => (!productFilter || r.productId === productFilter) && (ratingFilter === "all" || r.rating <= 2)
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#153C4D]">Product Reviews</h1>
        <p className="mt-1 text-sm text-slate-500">
          Reviews appear on the marketplace as soon as customers post them. Delete spam or abusive ones here — deleting
          is permanent and updates the product&apos;s average rating.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={ADMIN_SELECT}>
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {(
            [
              { value: "all", label: "All ratings" },
              { value: "low", label: "1–2 stars" },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setRatingFilter(f.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                ratingFilter === f.value ? "bg-[#153C4D] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!loading && (
          <span className="text-xs text-slate-400">
            {visible.length} review{visible.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    No reviews to show.
                  </td>
                </tr>
              )}
              {visible.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  productName={productName(review.productId)}
                  onDeleted={() => setReviews((prev) => prev.filter((r) => r.id !== review.id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  review,
  productName,
  onDeleted,
}: {
  review: ProductReview;
  productName: string;
  onDeleted: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProductReview(authedFetch, review.id);
      onDeleted();
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete review");
      setDeleting(false);
    }
  }

  return (
    <>
      <tr className="align-top">
        <td className="border-t border-slate-100 px-4 py-3 font-semibold text-[#153C4D]">{productName}</td>
        <td className="border-t border-slate-100 px-4 py-3">
          <StarRating value={review.rating} size={14} />
        </td>
        <td className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold text-slate-700">{review.authorName}</p>
          <p className="mt-1 max-w-xl whitespace-pre-line text-slate-600">{review.comment}</p>
        </td>
        <td className="whitespace-nowrap border-t border-slate-100 px-4 py-3 text-slate-500">
          {formatDisplayDate(review.createdAt.slice(0, 10))}
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-right">
          {confirmingDelete ? (
            <span className="flex items-center justify-end gap-2">
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
        </td>
      </tr>
      {deleteError && (
        <tr>
          <td colSpan={5} className="border-t border-slate-100 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-700">{deleteError}</p>
          </td>
        </tr>
      )}
    </>
  );
}
