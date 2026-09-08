"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { useCart } from "@/components/marketplace/cart-provider";
import { formatMoney } from "@/lib/currency";
import { FLAT_SHIPPING_FEE } from "@/lib/marketplace-config";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  const shippingFee = items.length > 0 ? FLAT_SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  useSeo(PAGE_META.marketplaceCart);

  return (
    <>
      <main>
        <PageHero
          title="Your Cart"
          backgroundImage="/images/hero-bg.webp"
          backgroundAlt="Sunlight streaming through a cave"
          homeHref="/sri-lanka/marketplace"
        />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-10 text-center">
                <p className="text-sm text-slate-500">Your cart is empty.</p>
                <Link
                  href="/sri-lanka/marketplace"
                  className="mt-4 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
                >
                  Browse the Marketplace
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                      </div>
                      <div className="min-w-[140px] flex-1">
                        <p className="text-sm font-bold text-[#153C4D]">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatMoney(item.priceUsd, "usd")} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-[#153C4D]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          disabled={item.maxStock != null && item.quantity >= item.maxStock}
                          className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="w-20 text-right text-sm font-bold text-[#153C4D]">
                        {formatMoney(item.priceUsd * item.quantity, "usd")}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove item"
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl bg-[#F7F5F0] p-6">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal, "usd")}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-slate-600">
                    <span>Shipping</span>
                    <span>{formatMoney(shippingFee, "usd")}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-[#153C4D]">
                    <span>Total</span>
                    <span>{formatMoney(total, "usd")}</span>
                  </div>
                </div>

                <Link
                  href="/sri-lanka/marketplace/checkout"
                  className="mt-6 block w-full rounded-full bg-[#8DC63F] py-4 text-center text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#72A62E]"
                >
                  Proceed to Checkout
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
