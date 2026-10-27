"use client";

import { Money } from "@/components/currency-provider";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Star, Truck, X, ZoomIn, ZoomOut } from "lucide-react";
import { cartLineKey, MAX_CART_QUANTITY, useCart } from "@/components/marketplace/cart-provider";
import {
  activeVariants,
  bestOfferOf,
  defaultVariant,
  deliveryEstimate,
  effectivePrice,
  priceRange,
  productStockStatus,
  stockStatusOf,
} from "@/lib/variants";
import { createProductReview, getProductReviews } from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { categoryPath } from "@/lib/category-tree";
import { formatDisplayDate } from "@/lib/date";
import { isRenderableImageSrc } from "@/lib/image";
import { sanitizeRichText } from "@/lib/rich-text";
import type { Category, Product, ProductReview } from "@/lib/api/types";

/** Product-wide stock (all variations together for a product that has them). */
export function stockStatus(product: Product): { stock: number; soldOut: boolean; low: boolean } {
  return productStockStatus(product);
}

export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "fill-[#F5A623] text-[#F5A623]" : "fill-slate-200 text-slate-200"}
        />
      ))}
    </span>
  );
}

/**
 * Full product view — gallery with zoom, price, options, add to cart,
 * description and reviews. Rendered by the product page
 * (/sri-lanka/marketplace/product/:id).
 */
export function ProductDetails({
  product,
  categories,
  onReviewAdded,
}: {
  product: Product;
  categories: Category[];
  onReviewAdded: (rating: number) => void;
}) {
  const { items, addItem } = useCart();
  // Products with variations sell per variation: price, stock and SKU all
  // follow whichever one is picked.
  const variants = activeVariants(product);
  const [variantId, setVariantId] = useState<string | null>(() => defaultVariant(product)?.id ?? null);
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const { stock, soldOut, low } = variant ? stockStatusOf(variant.stockLevel) : stockStatus(product);
  const priceSource = variant ?? product;
  const price = effectivePrice(priceSource);
  const listPrice = Number(priceSource.priceUsd);
  const onOffer = priceSource.offerPercent != null && price < listPrice;
  const delivery = deliveryEstimate(product);
  const inCart = items.find((i) => i.key === cartLineKey(product.id, variant?.id))?.quantity ?? 0;
  const canAdd = Math.max(0, Math.min(stock, MAX_CART_QUANTITY) - inCart);

  // The picked option's own photos first, then the product's.
  const images = [...new Set([...(variant?.images ?? []), ...product.images])].filter((src) =>
    isRenderableImageSrc(src)
  );
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, Math.min(quantity, canAdd), variant);
    setQuantity(1);
    setAdded(true);
  }

  const category = categories.find((c) => c.id === product.categoryId) ?? product.category;

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={images}
          name={product.name}
          active={activeImage}
          onActiveChange={setActiveImage}
          badge={
            soldOut ? (
              <span className="absolute left-0 top-4 z-10 rounded-r-full bg-[#153C4D] px-3 py-1 text-xs font-medium text-white">
                Sold Out
              </span>
            ) : onOffer ? (
              <span className="absolute left-0 top-4 z-10 rounded-r-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                {priceSource.offerPercent}% OFF
              </span>
            ) : null
          }
        />

        {/* Details */}
        <div className="flex flex-col">
          {category && (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {categoryPath(category, categories)}
            </p>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-snug text-[#153C4D] sm:text-3xl">
            <span className="box-decoration-clone bg-[linear-gradient(transparent_55%,rgba(245,166,35,0.35)_55%)] px-1">
              {product.name}
            </span>
          </h1>

          {(product.reviewCount ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-2 flex w-fit items-center gap-2 text-sm text-slate-500 hover:underline"
            >
              <StarRating value={product.averageRating ?? 0} />
              {(product.averageRating ?? 0).toFixed(1)} · {product.reviewCount} review
              {product.reviewCount === 1 ? "" : "s"}
            </button>
          )}

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className={`text-2xl font-bold ${onOffer ? "text-red-600" : "text-[#153C4D]"}`}>
              <Money amount={price} currency="usd" />
            </p>
            {onOffer && (
              <>
                <p className="text-base text-slate-400 line-through">
                  <Money amount={listPrice} currency="usd" />
                </p>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
                  {priceSource.offerTitle ? `${priceSource.offerTitle} · ` : ""}
                  {priceSource.offerPercent}% off
                </span>
              </>
            )}
          </div>
          {onOffer && priceSource.offerEndsAt && (
            <p className="mt-1 text-xs text-slate-500">
              Offer ends{" "}
              {new Date(priceSource.offerEndsAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}

          {variants.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Option{variant ? `: ${variant.name}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose an option">
                {variants.map((v) => {
                  const out = stockStatusOf(v.stockLevel).soldOut;
                  const selected = v.id === variantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setVariantId(v.id);
                        setQuantity(1);
                        setAdded(false);
                        setActiveImage(0);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-[#153C4D] bg-[#153C4D] text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-[#153C4D]"
                      } ${out ? "line-through opacity-50" : ""}`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3">
            {soldOut ? (
              <p className="text-sm font-semibold text-slate-500">Sold out</p>
            ) : low ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-600" />
                Low stock — only {stock} left
              </p>
            ) : (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                In stock ({stock} available)
              </p>
            )}
          </div>
          {delivery && !soldOut && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#153C4D]">
              <Truck size={16} className="text-[#8DC63F]" />
              {delivery}
            </p>
          )}

          {!soldOut && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-full border border-slate-300">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center text-slate-600 disabled:opacity-30"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-slate-800" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= canAdd}
                  onClick={() => setQuantity((q) => Math.min(canAdd, q + 1))}
                  className="grid h-10 w-10 place-items-center text-slate-600 disabled:opacity-30"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                disabled={canAdd <= 0}
                onClick={handleAdd}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#8DC63F] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#72A62E] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
            </div>
          )}
          {canAdd <= 0 && inCart > 0 && (
            <p className="mt-2 text-xs text-slate-500">You already have all available stock in your cart.</p>
          )}
          {added && (
            <p className="mt-3 text-sm text-emerald-700">
              Added to your cart.{" "}
              <Link to="/sri-lanka/marketplace/cart" className="font-semibold underline">
                View cart
              </Link>
            </p>
          )}

          {product.description && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</h2>
              <div
                className="rich-text mt-2 text-sm leading-relaxed text-slate-700"
                // Whitelisted tags only, attributes stripped — lib/rich-text.ts.
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl">
        <ProductReviews productId={product.id} onReviewAdded={onReviewAdded} />
      </div>
    </div>
  );
}

// --- Gallery with zoom ---------------------------------------------------------
// Desktop: hovering the main photo magnifies the spot under the cursor.
// Anywhere: tapping/clicking it opens a full-screen viewer, where a tap
// zooms in on that spot and the photo can then be dragged (or scrolled) to
// look around; arrows/swipe-free buttons move between photos.

const HOVER_ZOOM = 2.2;
const VIEWER_ZOOM = 2.5;

function ProductGallery({
  images,
  name,
  active,
  onActiveChange,
  badge,
}: {
  images: string[];
  name: string;
  active: number;
  onActiveChange: (index: number) => void;
  badge: React.ReactNode;
}) {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const current = images[active];

  function trackHover(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setHover({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => current && setViewerOpen(true)}
        onMouseMove={trackHover}
        onMouseLeave={() => setHover(null)}
        aria-label="Open the photo full screen to zoom in"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-slate-100"
      >
        {current && (
          <img
            src={current}
            alt={name}
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-150 ease-out"
            style={
              hover
                ? { transform: `scale(${HOVER_ZOOM})`, transformOrigin: `${hover.x}% ${hover.y}%` }
                : undefined
            }
          />
        )}
        {badge}
        {current && (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white opacity-90 transition group-hover:opacity-0">
            <ZoomIn size={14} /> Tap to zoom
          </span>
        )}
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => onActiveChange(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                active === i ? "border-[#153C4D]" : "border-transparent hover:border-slate-300"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && current && (
        <ImageViewer
          images={images}
          name={name}
          index={active}
          onIndexChange={onActiveChange}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

function ImageViewer({
  images,
  name,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  name: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const go = (delta: number) => {
    setZoomed(false);
    onIndexChange((index + delta + images.length) % images.length);
  };
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });

  // Escape closes, arrows move between photos, background doesn't scroll.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "ArrowRight") goRef.current(1);
      if (e.key === "ArrowLeft") goRef.current(-1);
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Zooming in on a tap: enlarge, then scroll so the tapped spot stays under the finger.
  function toggleZoom(e: React.MouseEvent<HTMLImageElement>) {
    if (drag.current?.moved) return;
    const box = scrollRef.current;
    if (!box) return;
    if (zoomed) {
      setZoomed(false);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setZoomed(true);
    requestAnimationFrame(() => {
      box.scrollLeft = fx * box.scrollWidth - box.clientWidth / 2;
      box.scrollTop = fy * box.scrollHeight - box.clientHeight / 2;
    });
  }

  // Mouse drag to pan while zoomed (touch devices pan by scrolling natively).
  function startDrag(e: React.MouseEvent) {
    const box = scrollRef.current;
    if (!zoomed || !box) return;
    drag.current = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop, moved: false };
  }
  function moveDrag(e: React.MouseEvent) {
    const box = scrollRef.current;
    const d = drag.current;
    if (!d || !box) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    box.scrollLeft = d.left - dx;
    box.scrollTop = d.top - dy;
  }
  function endDrag() {
    // Let the click handler see `moved` first, then clear.
    setTimeout(() => {
      drag.current = null;
    }, 0);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — photo ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-[120] flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
        <span>
          {index + 1} / {images.length}
          <span className="ml-3 hidden text-white/50 sm:inline">
            {zoomed ? "Drag to look around · tap to zoom out" : "Tap the photo to zoom in"}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onMouseDown={startDrag}
          onMouseMove={moveDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          className={`h-full w-full ${zoomed ? "overflow-auto" : "flex items-center justify-center overflow-hidden"}`}
        >
          <img
            src={images[index]}
            alt={name}
            draggable={false}
            onClick={toggleZoom}
            className={
              zoomed
                ? "block max-w-none cursor-grab select-none active:cursor-grabbing"
                : "max-h-full max-w-full cursor-zoom-in select-none object-contain"
            }
            style={zoomed ? { width: `${VIEWER_ZOOM * 100}%` } : undefined}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProductReviews({ productId, onReviewAdded }: { productId: string; onReviewAdded: (rating: number) => void }) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  // A backend without the reviews endpoint yet (404) hides the section
  // rather than showing an error to shoppers.
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProductReviews(productId)
      .then((result) => {
        if (!cancelled) setReviews(result);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (unavailable) return null;

  return (
    <section id="product-reviews" className="border-t border-slate-100 bg-slate-50 px-6 py-8 sm:px-8">
      <h3 className="text-lg font-extrabold uppercase tracking-wide text-[#153C4D]">Customer Reviews</h3>

      <div className="mt-5 grid gap-8 md:grid-cols-[1fr_320px]">
        <div>
          {loading && <p className="text-sm text-slate-400">Loading reviews...</p>}
          {!loading && reviews.length === 0 && (
            <p className="text-sm text-slate-500">No reviews yet — be the first to share what you think.</p>
          )}
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#153C4D]">{review.authorName}</p>
                  <span className="text-xs text-slate-400">{formatDisplayDate(review.createdAt.slice(0, 10))}</span>
                </div>
                <div className="mt-1">
                  <StarRating value={review.rating} size={14} />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{review.comment}</p>
              </li>
            ))}
          </ul>
        </div>

        <ReviewForm
          productId={productId}
          onCreated={(review) => {
            setReviews((prev) => [review, ...prev]);
            onReviewAdded(review.rating);
          }}
        />
      </div>
    </section>
  );
}

function ReviewForm({ productId, onCreated }: { productId: string; onCreated: (review: ProductReview) => void }) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const review = await createProductReview(productId, {
        authorName: authorName.trim(),
        rating,
        comment: comment.trim(),
      });
      onCreated(review);
      setAuthorName("");
      setRating(0);
      setComment("");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't post your review — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#153C4D] focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <h4 className="text-sm font-bold text-[#153C4D]">Write a review</h4>
      {submitted && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Thanks for your review!</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div>
        <span className="text-xs font-semibold text-slate-500">Your rating</span>
        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              className="p-0.5"
            >
              <Star
                size={24}
                className={
                  n <= (hoverRating || rating) ? "fill-[#F5A623] text-[#F5A623]" : "fill-slate-200 text-slate-200"
                }
              />
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        Your name
        <input
          required
          maxLength={80}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        Your review
        <textarea
          required
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Posting..." : "Post Review"}
      </button>
    </form>
  );
}

/** Card price: a single price, or "From $X" when variations differ in price; struck-through list price when on offer. */
export function ProductPrice({ product }: { product: Product }) {
  const { min, max, listMin } = priceRange(product);
  const onOffer = bestOfferOf(product) !== null && min < listMin;
  return (
    <>
      {min !== max && "From "}
      <span className={onOffer ? "font-semibold text-red-600" : undefined}>
        <Money amount={min} currency="usd" />
      </span>
      {onOffer && (
        <span className="ml-1.5 text-xs text-slate-400 line-through">
          <Money amount={listMin} currency="usd" />
        </span>
      )}
    </>
  );
}

/** "20% OFF" corner badge for product cards, or nothing. */
export function OfferBadge({ product }: { product: Product }) {
  const offer = bestOfferOf(product);
  if (!offer) return null;
  return (
    <span className="absolute right-0 top-4 rounded-l-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
      {activeVariants(product).length > 0 && offer !== product ? "Up to " : ""}
      {offer.offerPercent}% OFF
    </span>
  );
}
