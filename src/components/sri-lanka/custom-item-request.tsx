"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { submitCustomOrderRequest } from "@/lib/api/leads";
import { ApiRequestError } from "@/lib/api/errors";

const labelClass = "mb-1 block text-xs font-semibold text-slate-500";
const inputClass =
  "w-full rounded-full border border-slate-200 px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#8DC63F]";
const textareaClass =
  "w-full resize-none rounded-2xl border border-slate-200 px-5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#8DC63F]";

// "Can't find it in the catalog?" — a guest describes an item and we get
// back to them with a quote. Not a purchase: no price, no cart, this never
// touches checkout. Spec'd in BACKEND_CHANGES_MARKETPLACE_CUSTOM_ORDERS.md.
export default function CustomItemRequest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitCustomOrderRequest({
        site: "sri_lanka",
        name,
        email,
        itemDescription,
        notes: notes || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="custom-item-request" className="bg-[#F7F5F0] px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-5xl items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: copy */}
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8DC63F]/10">
            <PackageSearch className="h-6 w-6 text-[#8DC63F]" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            <span className="text-[#153C4D]">Can&apos;t Find</span>{" "}
            <span className="text-[#F5A623]">What You Want?</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
            Not every Italian product we can source is in the catalog yet. Tell us what you&apos;re after and
            we&apos;ll get back to you with a price and availability — no obligation to order.
          </p>
        </div>

        {/* Right: form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {sent ? (
            <div className="rounded-2xl bg-emerald-50 px-6 py-5 text-sm text-emerald-700">
              Thanks — we&apos;ve got your request and will email you a quote shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

              <div>
                <label htmlFor="custom-item-name" className={labelClass}>
                  Your name
                </label>
                <input
                  id="custom-item-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="custom-item-email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="custom-item-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="custom-item-description" className={labelClass}>
                  Item you&apos;d like a quote for
                </label>
                <input
                  id="custom-item-description"
                  name="itemDescription"
                  type="text"
                  required
                  placeholder="e.g. brand, size, quantity"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="custom-item-notes" className={labelClass}>
                  Anything else we should know? <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="custom-item-notes"
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={textareaClass}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-fit rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Request a Quote"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
