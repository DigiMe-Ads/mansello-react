import PageHero from "@/components/page-hero";
import VillaGallery from "@/components/sri-lanka/villa-gallery";
import RoomPricing from "@/components/sri-lanka/room-pricing";
import BookingCalendar from "@/components/sri-lanka/booking-calendar";
import Footer from "@/components/sri-lanka/footer";
import { BookingProvider } from "@/components/booking/booking-provider";
import { useContent } from "@/components/content-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";
import { lodgingBusinessSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { SRI_LANKA_BUSINESS } from "@/lib/seo/site";

export default function Airbnb() {
  const { c } = useContent();
  useSeo({
    ...PAGE_META.sriLankaAirbnb,
    jsonLd: [
      lodgingBusinessSchema({
        business: SRI_LANKA_BUSINESS,
        name: "Dona's Villa",
        description: PAGE_META.sriLankaAirbnb.description,
        path: PAGE_META.sriLankaAirbnb.path,
        image: PAGE_META.sriLankaAirbnb.image,
      }),
      breadcrumbSchema([
        { name: "Sri Lanka", path: "/sri-lanka" },
        { name: "Villa", path: "/sri-lanka/airbnb" },
      ]),
    ],
  });

  return (
    <>
      <main>
        <PageHero
          title="Villa"
          backgroundImage={c("sri_lanka.villaPhotos.heroImage")}
          backgroundAlt="Front facade of Dona's Villa"
          homeHref="/sri-lanka"
        />
        <VillaGallery />
        <BookingProvider propertySlug="donas-villa">
          <RoomPricing />
          <BookingCalendar />
        </BookingProvider>
      </main>
      <Footer />
    </>
  );
}
