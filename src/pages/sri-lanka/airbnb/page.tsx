import PageHero from "@/components/page-hero";
import VillaGallery from "@/components/sri-lanka/villa-gallery";
import RoomPricing from "@/components/sri-lanka/room-pricing";
import BookingCalendar from "@/components/sri-lanka/booking-calendar";
import Footer from "@/components/sri-lanka/footer";
import { BookingProvider } from "@/components/booking/booking-provider";

export default function Airbnb() {
  return (
    <main>
      <PageHero
        title="Villa"
        backgroundImage="/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-facade-bright.jpeg"
        backgroundAlt="Front facade of Dona's Villa"
        homeHref="/sri-lanka"
      />
      <VillaGallery />
      <BookingProvider propertySlug="donas-villa">
        <RoomPricing />
        <BookingCalendar />
      </BookingProvider>
      <Footer />
    </main>
  );
}
