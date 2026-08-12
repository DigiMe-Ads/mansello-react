"use client";

import { usePropertyBooking } from "@/components/booking/booking-provider";
import { pivotTiersByRooms } from "@/lib/api/pricing";
import { formatMoney } from "@/lib/currency";

const highlights = [
  "Free Wi-Fi",
  "Air-conditioned rooms",
  "Hot water",
  "Free on-site parking",
  "Airport transfers & tour transport on request",
];

const addonRows = [
  {
    addon: "Airport → Dona's Villa",
    price: "$29.99",
    copy: "Private pick-up from CMB arrivals, direct to the villa.",
  },
  {
    addon: "Dona's Villa → Airport",
    price: "$29.99",
    copy: "On-time private drop-off for your departure flight.",
  },
];

export default function RoomPricing() {
  const { property, loading, error } = usePropertyBooking();
  const pivot = property ? pivotTiersByRooms(property.pricingTiers) : null;

  return (
    <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
        <div>
          <p className="text-sm leading-relaxed text-slate-600">
            A calm, family-run stay in a coastal village between the Negombo lagoon and the sea — 
            around 30 minutes from Bandaranaike International Airport and within easy reach of 
            Negombo and Colombo.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Choose from one to three rooms depending on your group size. 
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
                  <th className="px-4 py-3 text-left font-semibold">Guests</th>
                  {pivot?.roomCounts.map((r) => (
                    <th key={r} className="px-4 py-3 text-left font-semibold">
                      {r} Room{r > 1 ? "s" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="border-t border-slate-200 px-4 py-3 text-slate-400">
                      Loading pricing...
                    </td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={5} className="border-t border-slate-200 px-4 py-3 text-red-600">
                      {error}
                    </td>
                  </tr>
                )}
                {pivot?.guestCounts.map((g) => (
                  <tr key={g}>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {g} guest{g > 1 ? "s" : ""}
                    </td>
                    {pivot.roomCounts.map((r) => (
                      <td key={r} className="border-t border-slate-200 px-4 py-3 text-slate-700">
                        {pivot.matrix[g][r] ? formatMoney(pivot.matrix[g][r]!.pricePerNight, property!.currency) : "—"}
                      </td>
                    ))}
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
                  <th className="px-4 py-3 text-left font-semibold">
                    Price
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {addonRows.map((row) => (
                  <tr key={row.addon}>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {row.addon}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {row.price}
                    </td>
                    <td className="border-t border-slate-200 px-4 py-3 text-slate-700">
                      {row.copy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
