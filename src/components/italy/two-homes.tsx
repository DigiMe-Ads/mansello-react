import Image from "next/image";
import { Signpost, Footprints } from "lucide-react";

const features = [
  {
    icon: Signpost,
    title: "Trusted travel guide",
    description:
      "Provides reliable information to help travelers plan their trips efficiently and safely.",
  },
  {
    icon: Footprints,
    title: "Mission & Vision",
    description:
      "Aims to connect people to positive experience through travel, helping them see the world differently.",
  },
];

export default function TwoHomes() {
  return (
    <section className="bg-white px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[380px_1fr]">
        {/* Left: photo composite */}
        <div className="relative mx-auto h-[560px] w-full max-w-[420px]">
          <div className="absolute left-0 top-16 h-72 w-72 rounded-full bg-[#F9E3C6]/60" />

          <div className="absolute bottom-0 left-4 h-[500px] w-[280px]">
            <Image
              src="/images/sri-lanka/about/homes/umbrella-suitcase-man.webp"
              alt="Traveler with an umbrella and an orange suitcase"
              fill
              sizes="280px"
              className="object-contain object-bottom"
            />
          </div>

          <div className="absolute right-0 top-0 h-32 w-32 overflow-hidden rounded-full border-[6px] border-white shadow-lg">
            <Image
              src="/images/italy/nest-bologna/nest-bologna-living-room-3.webp"
              alt="Living room at The Nest Bologna"
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>

          <div className="absolute bottom-8 right-0 h-56 w-56 overflow-hidden rounded-full border-[6px] border-[#DCEEEA] shadow-xl">
            <Image
              src="/images/italy/nest-bologna/nest-bologna-courtyard-entrance.jpeg"
              alt="Entrance courtyard at The Nest Bologna"
              fill
              sizes="224px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Right: copy */}
        <div className="relative">
          <h2 className="text-3xl font-bold leading-snug text-[#153C4D] sm:text-4xl">
            Two homes, two countries, one family.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-slate-500 sm:text-base">
            Mansello began with a simple belief: travel feels better when someone is genuinely 
            expecting you. What started as a family opening its doors to guests has grown into two 
            properties nearly 8,000 km apart - The Nest Bologna in northern Italy, and Dona&apos;s 
            Villa on Sri Lanka&apos;s western coast - connected by the same standard of care.
          </p>

          <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
            Whichever Mansello you stay at, you&apos;ll find the same things
            waiting: a clean and comfortable room, honest prices, and hosts
            who know the area inside out.
          </p>

          <div className="mt-8 flex items-start gap-6">
            <div className="flex max-w-md flex-1 flex-col gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 px-5 py-4"
                >
                  <f.icon className="mt-0.5 h-6 w-6 shrink-0 text-[#153C4D]" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-bold text-[#153C4D]">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {f.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
