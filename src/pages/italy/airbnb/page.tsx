import PageHero from "@/components/italy/page-hero";
import VillaGallery from "@/components/italy/villa-gallery";
import RoomPricing from "@/components/italy/room-pricing";
import BookingCalendar from "@/components/italy/booking-calendar";
import Footer from "@/components/italy/footer";
import { BookingProvider } from "@/components/booking/booking-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";
import { lodgingBusinessSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { ITALY_BUSINESS } from "@/lib/seo/site";

export default function Airbnb() {
  useSeo({
    ...PAGE_META.italyAirbnb,
    jsonLd: [
      lodgingBusinessSchema({
        business: ITALY_BUSINESS,
        name: "The Nest Bologna",
        description: PAGE_META.italyAirbnb.description,
        path: PAGE_META.italyAirbnb.path,
        image: PAGE_META.italyAirbnb.image,
      }),
      breadcrumbSchema([
        { name: "Italy", path: "/italy" },
        { name: "Apartment", path: "/italy/airbnb" },
      ]),
    ],
  });

  return (
    <>
      <main>
        <PageHero
          title="Apartment"
          backgroundImage="/images/bologna.jpg"
          backgroundAlt="Front facade of The Nest Bologna"
          homeHref="/italy"
        />
        <VillaGallery />
        <BookingProvider propertySlug="the-nest-bologna">
          <RoomPricing />
          <BookingCalendar />
        </BookingProvider>
      </main>
      <Footer />
    </>
  );
}
