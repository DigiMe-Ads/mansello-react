import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  CloudSun,
  Compass,
  Luggage,
  MapPin,
  MessageCircle,
  Plane,
  Umbrella,
  Watch,
} from "lucide-react";

const doodles = [
  { Icon: Plane, top: "8%", left: "28%", rotate: "-15deg" },
  { Icon: Luggage, top: "14%", left: "62%", rotate: "10deg" },
  { Icon: Compass, top: "6%", left: "84%", rotate: "0deg" },
  { Icon: MapPin, top: "40%", left: "6%", rotate: "0deg" },
  { Icon: Watch, top: "46%", left: "48%", rotate: "0deg" },
  { Icon: CloudSun, top: "38%", left: "92%", rotate: "0deg" },
  { Icon: Camera, top: "72%", left: "16%", rotate: "-8deg" },
  { Icon: Umbrella, top: "80%", left: "56%", rotate: "12deg" },
  { Icon: Plane, top: "78%", left: "88%", rotate: "20deg" },
  { Icon: Compass, top: "92%", left: "34%", rotate: "0deg" },
];

const steps = [
  {
    image: "/images/sri-lanka/airbnb/booking-flow/booking-flow-3.webp",
    alt: "Hikers checking a map from a mountain viewpoint",
    title: "Choose How to Book",
    description: "Standalone, or added to your stay.",
    cta: { label: "Book a Stay", href: "/sri-lanka/airbnb", external: false },
  },
  {
    image: "/images/destinations/kandy.webp",
    alt: "Temple complex in the misty hills of Sri Lanka",
    title: "Share Your Details",
    description: "Transfer type, date, flight & passengers.",
    cta: { label: "Request a Transfer", href: "/sri-lanka/transport#transfer-request", external: false },
  },
  {
    image: "/images/destinations/ella.jpg",
    alt: "Traveler with a backpack looking out over a jungle village",
    title: "Get Confirmed",
    description: "Email confirmation, driver details on WhatsApp.",
    cta: { label: "Chat on WhatsApp", href: "https://wa.me/message/TZ6XNDRH3PONM1", external: true },
  },
];

export default function BookingFlow() {
  return (
    <section className="relative overflow-hidden bg-[#DCEEEA] px-6 py-20 sm:px-12 lg:px-20">
      {/* Faint scattered travel-doodle pattern */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {doodles.map(({ Icon, top, left, rotate }, i) => (
          <Icon
            key={i}
            className="absolute h-8 w-8 text-[#153C4D] opacity-10"
            style={{ top, left, transform: `rotate(${rotate})` }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold sm:text-4xl">
          <span className="text-[#153C4D]">Booking</span>{" "}
          <span className="text-[#F5A623]">Flow</span>
        </h2>

        <div className="mt-12 grid gap-10 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-6">
          {steps.flatMap((step, i) => [
            <div key={step.image}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold text-[#153C4D] shadow-md">
                  {i + 1}
                </div>
              </div>

              <div className="mt-4 text-center">
                <h3 className="font-bold text-[#153C4D]">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                {step.cta.external ? (
                  <a
                    href={step.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#F5A623] transition hover:text-[#d4900f]"
                  >
                    <MessageCircle size={14} />
                    {step.cta.label}
                  </a>
                ) : (
                  <Link
                    href={step.cta.href}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#F5A623] transition hover:text-[#d4900f]"
                  >
                    {step.cta.label}
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            </div>,
            ...(i < steps.length - 1
              ? [
                  <div
                    key={`arrow-${step.image}`}
                    className="hidden items-center justify-center pt-16 text-[#153C4D]/40 sm:flex"
                  >
                    <ChevronRight size={32} strokeWidth={1.5} />
                  </div>,
                ]
              : []),
          ])}
        </div>
      </div>
    </section>
  );
}
