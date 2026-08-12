import MarketplaceHero from "@/components/sri-lanka/marketplace-hero";
import MarketplaceCategories from "@/components/sri-lanka/marketplace-categories";
import BrandsTrust from "@/components/sri-lanka/brands-trust";
import HowItWorks from "@/components/sri-lanka/how-it-works";
import DealOfTheDay from "@/components/sri-lanka/deal-of-the-day";
import BestProducts from "@/components/sri-lanka/best-products";
import Footer from "@/components/sri-lanka/footer";
import { MarketplaceProvider } from "@/components/marketplace/marketplace-provider";

export default function Marketplace() {
  return (
    <main>
      <MarketplaceHero />
      <MarketplaceCategories />
      <BrandsTrust />
      <HowItWorks />
      <DealOfTheDay />
      <MarketplaceProvider>
        <BestProducts />
      </MarketplaceProvider>
      <Footer />
    </main>
  );
}
