import MarketplaceHero from "@/components/sri-lanka/marketplace-hero";
import MarketplaceCategories from "@/components/sri-lanka/marketplace-categories";
import BrandsTrust from "@/components/sri-lanka/brands-trust";
import HowItWorks from "@/components/sri-lanka/how-it-works";
import DealOfTheDay from "@/components/sri-lanka/deal-of-the-day";
import BestProducts from "@/components/sri-lanka/best-products";
import CustomItemRequest from "@/components/sri-lanka/custom-item-request";
import Footer from "@/components/sri-lanka/footer";
import { MarketplaceProvider } from "@/components/marketplace/marketplace-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function Marketplace() {
  useSeo(PAGE_META.marketplace);

  return (
    <>
      <main>
        <MarketplaceHero />
        {/* Shared provider so the featured-categories section, Deal of the
            Day, and Best Products all show the same catalog data (one fetch)
            and share the same category filter/selection state. */}
        <MarketplaceProvider>
          <MarketplaceCategories />
          <BrandsTrust />
          <HowItWorks />
          <DealOfTheDay />
          <BestProducts />
        </MarketplaceProvider>
        <CustomItemRequest />
      </main>
      <Footer />
    </>
  );
}
