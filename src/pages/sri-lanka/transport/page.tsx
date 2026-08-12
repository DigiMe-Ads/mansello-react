import PageHero from "@/components/page-hero";
import TransportIntro from "@/components/sri-lanka/transport-intro";
import FixedPriceTransfers from "@/components/sri-lanka/fixed-price-transfers";
import BookingFlow from "@/components/sri-lanka/booking-flow";
import Footer from "@/components/sri-lanka/footer";

export default function Transport() {
  return (
    <main>
      <PageHero
        title="Transport"
        backgroundImage="/images/sri-lanka/transport/hero-transport.webp"
        backgroundAlt="F9 arches train passing through a lush green landscape in Sri Lanka"
        homeHref="/sri-lanka"
      />
      <TransportIntro />
      <FixedPriceTransfers />
      <BookingFlow />
      <Footer />
    </main>
  );
}