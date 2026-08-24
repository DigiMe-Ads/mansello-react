"use client";

const highlights = [
  "Free Wi-Fi",
  "Fully equipped kitchen",
  "Hot water",
  "Washing machine on-site",
];

export default function RoomPricing() {
  return (
    <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm leading-relaxed text-slate-600">
          A cosy, family-run stay in a quiet corner of Bologna – within easy reach of
          the historic centre and Bologna Guglielmo Marconi Airport.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          The apartment comfortably sleeps up to four guests thanks to a sofa-bed.
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
    </section>
  );
}
