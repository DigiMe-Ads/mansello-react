import { useParams } from "react-router-dom";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { PackageDetail } from "@/components/sri-lanka/package-detail";
import { getTourPackage } from "@/lib/tour-packages";
import { useSeo } from "@/lib/seo/use-seo";
import { touristTripSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import Link from "next/link";

export default function TourPackagePage() {
  const { slug } = useParams<{ slug: string }>();
  const pkg = slug ? getTourPackage(slug) : undefined;

  // Called before the not-found branch so the hook order stays stable.
  useSeo(
    pkg
      ? {
          title: pkg.title,
          description: `${pkg.duration} through Sri Lanka: ${pkg.route}. Private driver and vehicle arranged by Mansello.`,
          path: `/sri-lanka/transport/packages/${pkg.slug}`,
          image: "/images/sri-lanka/transport/hero-transport.webp",
          jsonLd: [
            touristTripSchema({
              name: pkg.title,
              description: `${pkg.duration} through Sri Lanka: ${pkg.route}.`,
              path: `/sri-lanka/transport/packages/${pkg.slug}`,
              image: "/images/sri-lanka/transport/hero-transport.webp",
            }),
            breadcrumbSchema([
              { name: "Sri Lanka", path: "/sri-lanka" },
              { name: "Transport & Tour Packages", path: "/sri-lanka/transport" },
              { name: pkg.title, path: `/sri-lanka/transport/packages/${pkg.slug}` },
            ]),
          ],
        }
      : {
          title: "Package not found",
          description: "This tour package could not be found.",
          path: `/sri-lanka/transport/packages/${slug ?? ""}`,
          noindex: true,
        }
  );

  if (!pkg) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F0] px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#F5A623]">Mansello</p>
        <h1 className="mt-2 text-2xl font-bold text-[#153C4D]">Package not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          We couldn&apos;t find that transport package.
        </p>
        <Link
          href="/sri-lanka/transport"
          className="mt-6 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          Back to Transport
        </Link>
      </main>
    );
  }

  return (
    <>
      <main>
        <PageHero
          title={pkg.title}
          backgroundImage="/images/sri-lanka/transport/hero-transport.webp"
          backgroundAlt={pkg.route}
          homeHref="/sri-lanka"
        />
        <PackageDetail pkg={pkg} />
      </main>
      <Footer />
    </>
  );
}
