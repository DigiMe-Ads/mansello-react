import PageHero from "@/components/italy/page-hero";
import TransportIntro from "@/components/italy/transport-intro";
import FixedPriceTransfers from "@/components/italy/fixed-price-transfers";
import BookingFlow from "@/components/italy/booking-flow";
import Footer from "@/components/italy/footer";

export default function Transport() {
  return (
    <main>
      <PageHero
        title="Transport"
        backgroundImage="/images/hero-bg.webp"
        backgroundAlt="Streets of Bologna, Italy"
        homeHref="/italy"
      />
      <TransportIntro />
      <FixedPriceTransfers />
      <BookingFlow />
      <Footer />
    </main>
  );
}
