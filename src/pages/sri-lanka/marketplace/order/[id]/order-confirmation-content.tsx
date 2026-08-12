"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { getOrder } from "@/lib/api/marketplace";
import { formatMoney } from "@/lib/currency";
import type { Order } from "@/lib/api/types";

export default function OrderConfirmationContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load your order");
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <main>
      <PageHero
        title="Order Confirmed"
        backgroundImage="/images/hero-bg.webp"
        backgroundAlt=""
        homeHref="/sri-lanka/marketplace"
      />

      <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-lg rounded-[2rem] bg-[#F7F5F0] p-10 text-center">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!error && !order && <p className="text-sm text-slate-500">Loading your order...</p>}

          {order && (
            <>
              <h1 className="text-2xl font-bold text-[#8DC63F]">Thank you, {order.customerName}!</h1>
              <p className="mt-3 text-sm text-slate-600">
                Your order has been placed as Cash on Delivery. We&apos;ll call {order.customerPhone} to confirm
                before dispatching.
              </p>

              <div className="mt-6 flex flex-col gap-2 text-left text-sm text-slate-700">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.productNameSnapshot} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.lineTotal, "usd")}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                  <span>Shipping</span>
                  <span>{formatMoney(order.shippingFee, "usd")}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#153C4D]">
                  <span>Total (due on delivery)</span>
                  <span>{formatMoney(order.total, "usd")}</span>
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

      <Footer />
    </main>
  );
}
