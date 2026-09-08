import PageHero from "@/components/page-hero";
import TwoHomes from "@/components/sri-lanka/two-homes";
import OurHome from "@/components/sri-lanka/our-home";
import AboutServices from "@/components/sri-lanka/about-services";
import Testimonials from "@/components/sri-lanka/testimonials";
import Footer from "@/components/sri-lanka/footer";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function About() {
  useSeo(PAGE_META.sriLankaAbout);

  return (
    <>
      <main>
        <PageHero
          title="About Us"
          backgroundImage="/images/sri-lanka/about/about-hero.webp"
          backgroundAlt="Stilt fishermen off the coast of Sri Lanka"
          homeHref="/sri-lanka"
        />
        <TwoHomes />
        <OurHome />
        <AboutServices />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
