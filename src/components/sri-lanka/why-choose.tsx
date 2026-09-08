import Image from "next/image";

const leftReasons = [
  "Family-run, guest-first - you deal directly with the hosts, not a call centre",
  "Support before and during your stay - reach us any time on WhatsApp",
];

const rightReasons = [
  "Airport convenience - 25 minutes from CMB, with door-to-door transfers",
  "Two countries, one standard - the same care at our Bologna apartment in Italy",
];

export default function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-[#0E4A49] px-6 pb-20 pt-16 sm:px-12 lg:px-20">
      {/* White cloud scallop, top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 aspect-[1304/321] w-full">
        <Image
          src="/images/sri-lanka/why-choose/top-clouds.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
        />
      </div>

      {/* City skyline watermark, bottom edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 aspect-[1304/207] w-full opacity-40">
        <Image
          src="/images/sri-lanka/why-choose/bottom-city.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      <div className="relative z-20 mx-auto max-w-6xl pt-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_240px] lg:items-center">
          <div>
            <h2
              className="text-4xl text-white sm:text-5xl"
              style={{ fontFamily: "var(--font-script)" }}
            >
              Why Choose Mansello?
            </h2>

            <div className="mt-8 grid grid-flow-col grid-rows-2 gap-x-10 gap-y-5 sm:grid-cols-2">
              {leftReasons.map((reason) => (
                <div key={reason} className="flex items-start gap-3">
                  <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#F5A623]" />
                  <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                    {reason}
                  </p>
                </div>
              ))}
              {rightReasons.map((reason) => (
                <div key={reason} className="flex items-start gap-3">
                  <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-[#F5A623]" />
                  <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 24 hours badge */}
          <div className="mx-auto w-fit text-center lg:mx-0">
            <div className="relative inline-block leading-none">
              <span
                className="text-[6rem] font-extrabold leading-none sm:text-[7rem]"
                style={{ WebkitTextStroke: "3px #F5C243", color: "transparent" }}
              >
                24
              </span>
              <span className="absolute right-0 top-[40%] translate-x-[30%] -translate-y-1/2 rotate-[-6deg] whitespace-nowrap rounded bg-[#F5C243] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0E4A49] shadow-md">
                Hours
              </span>
            </div>
            <p className="-mt-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#F5C243]">
              Service
            </p>
            <p className="mt-3 text-4xl font-extrabold text-white">Call Us</p>
          </div>
        </div>
      </div>
    </section>
  );
}
