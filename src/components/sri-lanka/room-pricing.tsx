"use client";

import { usePropertyBooking } from "@/components/booking/booking-provider";
import { RoomImageSlider } from "@/components/sri-lanka/room-image-slider";
import { formatMoney } from "@/lib/currency";

const highlights = [
  "Free Wi-Fi",
  "Air-conditioned rooms",
  "Hot water",
  "Free on-site parking",
];

export default function RoomPricing() {
  const { property, loading, error } = usePropertyBooking();
  const rooms = property?.rooms ? [...property.rooms].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
        <div>
          <p className="text-sm leading-relaxed text-slate-600">
            A calm, family-run stay in a coastal village between the Negombo lagoon and the sea —
            around 25 minutes from Bandaranaike International Airport and within easy reach of
            Negombo and Colombo.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Choose one or more rooms depending on your group size — pick the exact rooms you want
            when you book below. However many rooms you book, you and your group have the entire
            villa to yourselves — we only ever host one party at a time.
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

        <div>
          {loading && <p className="text-sm text-slate-400">Loading rooms...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && rooms.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {rooms.map((room) => {
                return (
                  <div
                    key={room.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
                  >
                    <div className="relative h-44 w-full bg-slate-100">
                      <RoomImageSlider images={room.images} alt={room.name} />
                    </div>
                    <div className="px-5 py-4">
                      <h3 className="font-bold text-[#153C4D]">{room.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {room.subtitle} · Sleeps {room.capacity}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-[#153C4D]">
                        {formatMoney(Number(room.pricePerNight), property!.currency)}{" "}
                        <span className="text-xs font-normal text-slate-400">/ night</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
