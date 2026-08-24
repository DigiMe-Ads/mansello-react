"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { useCart } from "@/components/marketplace/cart-provider";
import { createOrder, getShippingRates } from "@/lib/api/marketplace";
import { ApiRequestError, isValidationError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import { computeShippingFee } from "@/lib/shipping";
import { FLAT_SHIPPING_FEE } from "@/lib/marketplace-config";
import type { ShippingRate } from "@/lib/api/types";

export default function CheckoutPage() {
  const { items, subtotal, totalWeightKg, clear } = useCart();
  const router = useRouter();

  const [shippingRates, setShippingRates] = useState<ShippingRate[] | null>(null);

  useEffect(() => {
    // Best-effort — falls back to the flat fee below if this 404s (endpoint
    // not live yet) or hasn't resolved by render time.
    getShippingRates()
      .then(setShippingRates)
      .catch(() => setShippingRates([]));
  }, []);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const computedFee = shippingRates?.length ? computeShippingFee(shippingRates, totalWeightKg) : null;
  const shippingFee = items.length === 0 ? 0 : (computedFee ?? FLAT_SHIPPING_FEE);
  const total = subtotal + shippingFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const order = await createOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        notes: notes || undefined,
        shippingFee,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clear();
      router.push(`/sri-lanka/marketplace/order/${order.id}`);
    } catch (err) {
      if (isValidationError(err) && err.details) {
        const errors: Record<string, string> = {};
        for (const d of err.details) errors[d.path.replace(/^body\./, "")] = d.message;
        setFieldErrors(errors);
      } else if (err instanceof ApiRequestError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main>
        <PageHero
          title="Checkout"
          backgroundImage="/images/hero-bg.webp"
          backgroundAlt=""
          homeHref="/sri-lanka/marketplace"
        />
        <section className="bg-white px-6 py-16 text-center sm:px-12 lg:px-20">
          <p className="text-sm text-slate-500">Your cart is empty.</p>
          <Link
            href="/sri-lanka/marketplace"
            className="mt-4 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
          >
            Browse the Marketplace
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <PageHero
        title="Checkout"
        backgroundImage="/images/hero-bg.webp"
        backgroundAlt=""
        homeHref="/sri-lanka/marketplace"
      />

      <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_320px]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#153C4D]">Delivery details</h2>
            <p className="text-sm text-slate-500">
              Cash on delivery — we&apos;ll call you to confirm before shipping.
            </p>

            {submitError && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</p>}

            <div>
              <input
                type="text"
                required
                placeholder="Full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {fieldErrors.customerName && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.customerName}</p>}
            </div>
            <div>
              <input
                type="tel"
                required
                placeholder="Phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {fieldErrors.customerPhone && (
                <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.customerPhone}</p>
              )}
            </div>
            <div>
              <textarea
                required
                placeholder="Delivery address"
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full resize-none rounded-3xl bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {fieldErrors.deliveryAddress && (
                <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.deliveryAddress}</p>
              )}
            </div>
            <textarea
              placeholder="Notes (optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-3xl bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
            >
              {submitting ? "Placing order..." : `Place Order — ${formatMoney(total, "usd")}`}
            </button>
          </form>

          <div className="h-fit rounded-2xl bg-[#F7F5F0] p-6">
            <h3 className="text-sm font-bold text-[#153C4D]">Order Summary</h3>
            <div className="mt-4 flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm text-slate-600">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatMoney(item.priceUsd * item.quantity, "usd")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-sm text-slate-600">
              <span>Shipping</span>
              <span>{formatMoney(shippingFee, "usd")}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-bold text-[#153C4D]">
              <span>Total</span>
              <span>{formatMoney(total, "usd")}</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
