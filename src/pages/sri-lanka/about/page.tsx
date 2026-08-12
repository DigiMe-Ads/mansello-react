import PageHero from "@/components/page-hero";
import TwoHomes from "@/components/sri-lanka/two-homes";
import OurHome from "@/components/sri-lanka/our-home";
import AboutServices from "@/components/sri-lanka/about-services";
import Testimonials from "@/components/sri-lanka/testimonials";
import Footer from "@/components/sri-lanka/footer";

export default function About() {
  return (
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
      <Footer />
    </main>
  );
}
