import { useParams } from "react-router-dom";
import Navbar from "@/components/italy/navbar";
import Footer from "@/components/italy/footer";
import { DestinationHero } from "@/components/destination-hero";
import { DestinationDetail } from "@/components/destination-detail";
import { getDestination, ITALY_DESTINATIONS } from "@/lib/destinations";
import { useSeo } from "@/lib/seo/use-seo";
import { truncateForMeta } from "@/lib/seo/site";
import { touristDestinationSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import Link from "next/link";

export default function ItalyDestinationPage() {
  const { slug } = useParams<{ slug: string }>();
  const destination = slug ? getDestination(ITALY_DESTINATIONS, slug) : undefined;

  // Called before the not-found branch so the hook order stays stable.
  useSeo(
    destination
      ? {
          title: `${destination.name} — ${destination.eyebrow}`,
          description: truncateForMeta(destination.paragraphs[0] ?? destination.tagline),
          path: `/italy/destinations/${destination.slug}`,
          image: destination.image,
          jsonLd: [
            touristDestinationSchema({
              name: destination.name,
              description: truncateForMeta(destination.paragraphs[0] ?? destination.tagline),
              path: `/italy/destinations/${destination.slug}`,
              image: destination.image,
              countryCode: "IT",
            }),
            breadcrumbSchema([
              { name: "Italy", path: "/italy" },
              { name: destination.name, path: `/italy/destinations/${destination.slug}` },
            ]),
          ],
        }
      : {
          title: "Destination not found",
          description: "This destination page could not be found.",
          path: `/italy/destinations/${slug ?? ""}`,
          noindex: true,
        }
  );

  if (!destination) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F0] px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F5A623]">Mansello</p>
        <h1 className="mt-2 text-2xl font-bold text-[#153C4D]">Destination not found</h1>
        <p className="mt-2 text-sm text-slate-500">We couldn&apos;t find that destination.</p>
        <Link
          href="/italy/about"
          className="mt-6 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          Back to About
        </Link>
      </main>
    );
  }

  return (
    <>
      <main>
        <DestinationHero destination={destination} navbar={<Navbar />} homeHref="/italy" />
        <DestinationDetail
          destination={destination}
          otherDestinations={ITALY_DESTINATIONS.filter((d) => d.slug !== destination.slug)}
          destinationsBasePath="/italy/destinations"
          bookHref="/italy/airbnb"
          bookLabel="Book a Stay at The Nest Bologna"
        />
      </main>
      <Footer />
    </>
  );
}
