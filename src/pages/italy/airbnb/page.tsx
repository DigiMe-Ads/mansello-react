import PageHero from "@/components/italy/page-hero";
import VillaGallery from "@/components/italy/villa-gallery";
import RoomPricing from "@/components/italy/room-pricing";
import BookingCalendar from "@/components/italy/booking-calendar";
import Footer from "@/components/italy/footer";
import { BookingProvider } from "@/components/booking/booking-provider";

export default function Airbnb() {
  return (
    <main>
      <PageHero
        title="BnB"
        backgroundImage="/images/italy-bnb-bg.jpg"
        backgroundAlt="Front facade of The Nest Bologna"
        homeHref="/italy"
      />
      <VillaGallery />
      <BookingProvider propertySlug="the-nest-bologna">
        <RoomPricing />
        <BookingCalendar />
      </BookingProvider>
      <Footer />
    </main>
  );
}
