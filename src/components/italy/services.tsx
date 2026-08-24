import Image from "next/image";

type ServiceCard = {
  step: string;
  ribbonColor: string;
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
};

const cards: ServiceCard[] = [
  {
    step: "01",
    ribbonColor: "#2E6FE0",
    icon: "/images/sri-lanka/services/icon-choose-travel-dates.webp",
    iconAlt: "Choose your travel dates icon",
    title: "Choose Your Dates",
    description:
      "Pick your check-in and check-out dates on our live availability calendar - no back-and-forth needed.",
  },
  {
    step: "02",
    ribbonColor: "#F0A93A",
    icon: "/images/sri-lanka/services/icon-airport-to-bnb-transfer.webp",
    iconAlt: "Airport to bed and breakfast transfer icon",
    title: "Airport → B&B Transfer",
    description:
      "Private pick-up from Bologna Guglielmo Marconi Airport straight to your room. Contact us for a flat-rate quote - no haggling, no waiting.",
  },
  {
    step: "03",
    ribbonColor: "#7BC142",
    icon: "/images/sri-lanka/services/icon-bnb-to-airport-transfer.webp",
    iconAlt: "Bed and breakfast to airport transfer icon",
    title: "B&B → Airport Transfer",
    description:
      "Guaranteed on-time drop-off for your departure flight. Flat-rate quote, arranged the night before.",
  },
  {
    step: "04",
    ribbonColor: "#7BC142",
    icon: "/images/sri-lanka/services/icon-custom-transport-packages.webp",
    iconAlt: "Custom transport packages icon",
    title: "Custom Transport Packages",
    description:
      "Day trips and multi-day transport tailored to your itinerary - Modena, Ferrara, Florence, Venice and beyond. Tell us your plan and we'll quote a fair price.",
  },
];

export default function Services() {
  return (
    <section className="relative bg-[#0E4A49] px-6 pt-20 sm:px-12 lg:px-20">
      {/* Plane trail, top right */}
      <div className="pointer-events-none absolute right-6 top-6 z-10 h-24 w-40 sm:right-12 sm:h-32 sm:w-56 lg:right-20">
        <Image
          src="/images/sri-lanka/services/airplane-flight-trail-icon.webp"
          alt=""
          fill
          sizes="(min-width: 640px) 224px, 160px"
          className="object-contain"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Traveler with the Pisa tower behind him, left side (desktop): spans from
            the top of the heading down to the bottom of the colored background */}
        <div className="pointer-events-none absolute left-0 top-0 z-0 hidden aspect-301/640 lg:block lg:inset-y-0">
          <Image
            src="/images/sri-lanka/services/leaning-tower-pisa-watermark-pattern.webp"
            alt=""
            fill
            sizes="384px"
            className="object-contain object-bottom opacity-50"
          />
          <Image
            src="/images/sri-lanka/services/backpacker-traveler-with-orange-suitcase.webp"
            alt="Traveler with an orange rolling suitcase"
            fill
            sizes="384px"
            className="relative z-10 object-contain object-bottom"
          />
        </div>

        {/* Heading + cards */}
        <div className="lg:pl-96">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            We offer Best <span className="text-[#F0A93A]">Services</span>
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Everything you need for a smooth stay - from the moment you land
            to the moment you leave.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-4xl bg-white px-6 pb-28 pt-8 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative h-10 w-10">
                  <Image
                    src={card.icon}
                    alt={card.iconAlt}
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>

                <h3 className="mt-4 text-base font-bold text-[#0E4A49]">
                  {card.title}
                </h3>

                {card.description && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {card.description}
                  </p>
                )}

                {/* Step badge, bottom-left corner, card's rounding clips it automatically */}
                <div
                  className="absolute bottom-0 left-0 z-10 h-20 w-24 sm:h-24 sm:w-28"
                  style={{ backgroundColor: card.ribbonColor }}
                >
                  {/* White notch that carves a concave curve into the badge's top-right corner */}
                  <div className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-white" />
                </div>
                <div className="absolute bottom-3 left-4 z-20 leading-none text-white sm:bottom-4 sm:left-5">
                  <span className="block text-[11px] font-medium sm:text-xs">
                    Step
                  </span>
                  <span className="block text-2xl font-bold sm:text-3xl">
                    {card.step}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Traveler, mobile only (desktop version lives in the absolute block above) */}
          <div className="relative mx-auto mt-10 h-85 w-55 lg:hidden">
            <Image
              src="/images/sri-lanka/services/backpacker-traveler-with-orange-suitcase.webp"
              alt="Traveler with an orange rolling suitcase"
              fill
              sizes="220px"
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Pill-shaped photo strip, aligned right with half of it bleeding below the section */}
        <div className="relative z-10 ml-auto mt-16 h-20 w-full max-w-3xl sm:h-24">
          <div className="absolute right-0 top-0 h-40 w-full overflow-hidden rounded-full sm:h-48">
            <Image
              src="/images/italy-bg2.jpg"
              alt="Sunlit courtyard entrance at The Nest Bologna"
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
