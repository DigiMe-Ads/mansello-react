import PageHero from "@/components/italy/page-hero";
import TwoHomes from "@/components/italy/two-homes";
import OurHome from "@/components/italy/our-home";
import AboutServices from "@/components/italy/about-services";
import Testimonials from "@/components/italy/testimonials";
import Footer from "@/components/italy/footer";

export default function About() {
  return (
    <main>
      <PageHero
        title="About Us"
        backgroundImage="/images/italy/nest-bologna/nest-bologna-exterior-3.webp"
        backgroundAlt="Entrance of The Nest Bologna in Italy"
        homeHref="/italy"
      />
      <TwoHomes />
      <OurHome />
      <AboutServices />
      <Testimonials />
      <Footer />
    </main>
  );
}
