import Image from "next/image";
import { PackageCheck, ShoppingBag, TicketsPlane } from "lucide-react";

const steps = [
  {
    step: "01",
    ribbonColor: "#F5A623",
    icon: TicketsPlane,
    title: "Browse",
    description: "Explore our range of genuine Italian products, priced in LKR.",
  },
  {
    step: "02",
    ribbonColor: "#8DC63F",
    icon: ShoppingBag,
    title: "Order",
    description: "Check out securely online or reserve via WhatsApp.",
  },
  {
    step: "03",
    ribbonColor: "#8DC63F",
    icon: PackageCheck,
    title: "Receive",
    description: "We deliver island-wide, straight to your door.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-[#0E4A49] px-6 py-20 sm:px-12 lg:px-20">
      {/* Plane trail, top right */}
      <div className="pointer-events-none absolute right-6 top-6 z-0 h-24 w-40 sm:right-12 sm:h-32 sm:w-56 lg:right-20">
        <Image
          src="/images/sri-lanka/services/airplane-flight-trail-icon.webp"
          alt=""
          fill
          sizes="(min-width: 640px) 224px, 160px"
          className="object-contain"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          <span className="text-white">How It</span>{" "}
          <span className="text-[#F5A623]">Works</span>
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="relative overflow-hidden rounded-[2.5rem] bg-white px-6 pb-10 pt-8 text-center shadow-lg"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center">
                <s.icon
                  className="h-11 w-11 text-slate-400"
                  strokeWidth={1.25}
                />
              </div>

              <h3 className="mt-3 text-lg font-bold text-[#153C4D]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {s.description}
              </p>

              {/* Diagonal step ribbon, clipped into the card's rounded bottom-left corner */}
              <div
                className="absolute bottom-0 left-0 h-14 w-14"
                style={{
                  backgroundColor: s.ribbonColor,
                  clipPath: "polygon(0 100%, 100% 100%, 0 0)",
                }}
              />
              <span className="absolute bottom-2.5 left-3.5 z-10 text-xs font-semibold leading-tight text-white">
                {s.step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
