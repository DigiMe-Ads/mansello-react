"use client";

import { usePropertyBooking } from "@/components/booking/booking-provider";
import { formatMoney } from "@/lib/currency";

const highlights = [
  "Free Wi-Fi",
  "Fully equipped kitchen",
  "Hot water",
  "Washing machine on-site",
  "Airport transfers & tour transport on request",
];

export default function RoomPricing() {
  const { property, loading, error } = usePropertyBooking();
  const tiers = property
    ? [...property.pricingTiers].sort((a, b) => a.guestCount - b.guestCount || a.rooms - b.rooms)
    : [];

  return (
    <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
        <div>
          <p className="text-sm leading-relaxed text-slate-600">
            A cosy, family-run stay in a quiet corner of Bologna – within easy reach of 
            the historic centre and Bologna Guglielmo Marconi Airport.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            The apartment comfortably sleeps up to four guests thanks to a sofa-bed. 
            Airport transfers can be added at checkout.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-8">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-[#153C4D] text-white">
                  <th className="px-4 py-3 text-left font-semibold">
                    Guests
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Price per Night
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={2} className="border-t border-slate-200 px-4 py-3 text-slate-400">
                      Loading pricing...
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={2} className="border-t border-slate-200 px-4 py-3 text-red-600">
                      {error}
                    </td>
                  </tr>
                )}
                {tiers.map((tier) => (
                  <tr key={tier.id}>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {tier.guestCount} guest{tier.guestCount > 1 ? "s" : ""}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {formatMoney(tier.pricePerNight, property!.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-[#153C4D] text-white">
                  <th className="px-4 py-3 text-left font-semibold">
                    Add-on
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                    Airport ⇄ The Nest Bologna
                  </td>
                  <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                    Private transfers to and from Bologna Guglielmo Marconi
                    Airport - contact us for a fixed quote.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
