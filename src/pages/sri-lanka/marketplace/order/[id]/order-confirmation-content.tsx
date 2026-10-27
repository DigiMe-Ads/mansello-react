"use client";

import { Money } from "@/components/currency-provider";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { getOrder } from "@/lib/api/marketplace";
import { useCart } from "@/components/marketplace/cart-provider";
import { PENDING_ORDER_KEY } from "@/components/payments/hosted-checkout-panel";
import type { Order } from "@/lib/api/types";
import { useSeo } from "@/lib/seo/use-seo";
import { PRIVATE_META } from "@/lib/seo/page-meta";

export default function OrderConfirmationContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const { clear } = useCart();

  // Coming back from a hosted payment page (Payments.lk) proves nothing: the
  // order only becomes "confirmed" once the backend receives the signed
  // webhook, which can land a few seconds after the redirect. Poll until it
  // settles, the same way the booking confirmation page does.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await getOrder(orderId);
        if (cancelled) return;
        setOrder(result);
        if (result.status !== "pending") return;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load your order");
        return;
      }
      attempts += 1;
      if (attempts >= 10) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      timer = setTimeout(poll, 1500);
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  // Clear the cart once — and only for the order this browser just paid
  // (remembered before the redirect), so revisiting an old order link never
  // empties a new cart.
  const paid = order != null && order.status !== "pending" && order.status !== "cancelled";
  useEffect(() => {
    if (!paid) return;
    try {
      if (window.sessionStorage.getItem(PENDING_ORDER_KEY) === orderId) {
        window.sessionStorage.removeItem(PENDING_ORDER_KEY);
        clear();
      }
    } catch {
      // storage blocked — leave the cart alone
    }
  }, [paid, orderId, clear]);

  useSeo(PRIVATE_META.order(orderId));

  return (
    <>
      <main>
        <PageHero
          title="Order Confirmed"
          backgroundImage="/images/hero-bg.webp"
          backgroundAlt="Sunlight streaming through a cave"
          homeHref="/sri-lanka/marketplace"
        />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-lg rounded-[2rem] bg-[#F7F5F0] p-10 text-center">
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!error && !order && <p className="text-sm text-slate-500">Loading your order...</p>}

            {order && order.status === "pending" && (
              <>
                <h1 className="text-2xl font-bold text-[#153C4D]">Confirming your payment...</h1>
                <p className="mt-3 text-sm text-slate-600">
                  {timedOut
                    ? "This is taking longer than usual. If you've paid (crypto can take a while to confirm), your order is safe — we'll email you once it's confirmed."
                    : "This usually takes just a moment."}
                </p>
              </>
            )}

            {order && order.status === "cancelled" && (
              <>
                <h1 className="text-2xl font-bold text-[#153C4D]">This order wasn&apos;t completed</h1>
                <p className="mt-3 text-sm text-slate-600">
                  No payment was taken. Your cart is still saved if you&apos;d like to try again.
                </p>
              </>
            )}

            {paid && (
              <>
                {/* The public order lookup returns only the first name and a
                    masked phone (or neither) for privacy. */}
                <h1 className="text-2xl font-bold text-[#8DC63F]">
                  Thank you{order.customerName ? `, ${order.customerName}` : ""}!
                </h1>
                <p className="mt-3 text-sm text-slate-600">
                  Your payment was successful and your order is confirmed. We&apos;ll call{" "}
                  {order.customerPhone || "you"} if we need anything before dispatching.
                </p>

                <div className="mt-6 flex flex-col gap-2 text-left text-sm text-slate-700">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.productNameSnapshot}
                        {item.variantNameSnapshot ? ` (${item.variantNameSnapshot})` : ""} × {item.quantity}
                      </span>
                      <span><Money amount={item.lineTotal} currency="usd" charged /></span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                    <span>Shipping</span>
                    <span><Money amount={order.shippingFee} currency="usd" charged /></span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#153C4D]">
                    <span>Total Paid</span>
                    <span><Money amount={order.total} currency="usd" charged /></span>
                  </div>
                </div>
              </>
            )}

            <Link
              href="/sri-lanka/marketplace"
              className="mt-8 inline-block rounded-full bg-[#153C4D] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0e2c38]"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
