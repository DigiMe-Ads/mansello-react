"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { useCart } from "@/components/marketplace/cart-provider";
import { CheckoutPaymentStep } from "@/components/marketplace/checkout-payment-step";
import { createOrder } from "@/lib/api/marketplace";
import { ApiRequestError, isValidationError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import { useShippingFee } from "@/lib/hooks/use-shipping-fee";
import { FLAT_SHIPPING_FEE } from "@/lib/marketplace-config";
import type { CreateOrderResponse, ShippingRate } from "@/lib/api/types";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function CheckoutPage() {
  const { items, subtotal, totalWeightKg, clear } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Once the order + Stripe clientSecret come back, the delivery-details
  // form is replaced by the payment step below — the cart itself isn't
  // cleared until payment actually succeeds (CheckoutPaymentStep navigates
  // to the confirmation page on success, which is what clears it).
  const [paymentInfo, setPaymentInfo] = useState<CreateOrderResponse | null>(null);

  // Same hook the cart uses, so both pages always quote the same fee.
  const { shippingFee: liveShippingFee, resolved: feeResolved } = useShippingFee();

  // Frozen at submit. Without this the sidebar keeps recomputing after the
  // order exists, so a late-arriving rate change could leave the summary
  // showing a different total from the one the customer is being charged.
  const [chargedShippingFee, setChargedShippingFee] = useState<number | null>(null);

  const shippingFee = chargedShippingFee ?? liveShippingFee;
  const total = subtotal + shippingFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    // Lock the fee to whatever the customer was just shown.
    const feeAtSubmit = liveShippingFee;
    setChargedShippingFee(feeAtSubmit);

    try {
      const result = await createOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        notes: notes || undefined,
        shippingFee: feeAtSubmit,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setPaymentInfo(result);
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
      <>
        <main>
          <PageHero
            title="Checkout"
            backgroundImage="/images/hero-bg.webp"
            backgroundAlt="Sunlight streaming through a cave"
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
        </main>
        <Footer />
      </>
    );
  }

  useSeo(PAGE_META.marketplaceCheckout);

  return (
    <>
      <main>
        <PageHero
          title="Checkout"
          backgroundImage="/images/hero-bg.webp"
          backgroundAlt="Sunlight streaming through a cave"
          homeHref="/sri-lanka/marketplace"
        />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_320px]">
            {paymentInfo ? (
              <CheckoutPaymentStep
                order={paymentInfo.order}
                clientSecret={paymentInfo.clientSecret}
                confirmationPath={`/sri-lanka/marketplace/order/${paymentInfo.order.id}`}
                onPaid={clear}
              />
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[#153C4D]">Delivery details</h2>
                <p className="text-sm text-slate-500">
                  Paid securely by card, same as booking a stay — you&apos;ll enter your card details on the next
                  step.
                </p>

                {submitError && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</p>}

                <div>
                  <label htmlFor="checkout-name" className="mb-1 block pl-2 text-xs font-semibold text-slate-500">
                    Full name
                  </label>
                  <input
                    id="checkout-name"
                    name="customerName"
                    type="text"
                    required
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {fieldErrors.customerName && <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.customerName}</p>}
                </div>
                <div>
                  <label htmlFor="checkout-phone" className="mb-1 block pl-2 text-xs font-semibold text-slate-500">
                    Phone number
                  </label>
                  <input
                    id="checkout-phone"
                    name="customerPhone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-full bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {fieldErrors.customerPhone && (
                    <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.customerPhone}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="checkout-address" className="mb-1 block pl-2 text-xs font-semibold text-slate-500">
                    Delivery address
                  </label>
                  <textarea
                    id="checkout-address"
                    name="deliveryAddress"
                    required
                    rows={3}
                    autoComplete="street-address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full resize-none rounded-3xl bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  {fieldErrors.deliveryAddress && (
                    <p className="mt-1 pl-2 text-xs text-red-600">{fieldErrors.deliveryAddress}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="checkout-notes" className="mb-1 block pl-2 text-xs font-semibold text-slate-500">
                    Notes <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full resize-none rounded-3xl bg-[#F7F5F0] px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full rounded-full bg-[#8DC63F] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
                >
                  {submitting ? "Preparing payment..." : `Continue to Payment — ${formatMoney(total, "usd")}`}
                </button>
              </form>
            )}

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

      </main>
      <Footer />
    </>
  );
}
