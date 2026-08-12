import Image from "next/image";

const services = [
  {
    icon: "/images/sri-lanka/about/services/hospitality.webp",
    title: "Genuine Hospitality",
    description:
      "We're hosts, not a hotel chain. You'll always deal with the family directly - before, during and after your stay.",
  },
  {
    icon: "/images/sri-lanka/about/services/prices.webp",
    title: "Honest Pricing",
    description:
      "Clear room rates and fixed transfer prices, published upfront. What you see is exactly what you pay.",
  },
  {
    icon: "/images/sri-lanka/about/services/knowledge.webp",
    title: "Local Knowledge",
    description:
      "From Negombo's fish market to Bologna's best trattoria - we share the places we actually go ourselves.",
  },
];

export default function AboutServices() {
  return (
    <section className="bg-[#0E4A49] px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            <span className="text-[#F5A623]">Our Amazing</span>{" "}
            <span className="text-white">Services</span>
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Destinations worth exploring! Here are a few popular spots
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="rounded-4xl border-4 border-[#DCEEEA] bg-white px-6 py-10 text-center shadow-sm"
            >
              <div className="relative mx-auto h-20 w-20">
                <Image
                  src={s.icon}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#153C4D]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* <div className="mt-8 text-right">
          <p className="text-sm font-medium text-white">
            Wornderful Services For You
          </p>
          <h3 className="text-4xl font-extrabold uppercase tracking-wide text-[#F5A623] sm:text-5xl lg:text-6xl">
            Services We Offer
          </h3>
        </div> */}
      </div>
    </section>
  );
}
