import PageHero from "@/components/italy/page-hero";
import TwoHomes from "@/components/italy/two-homes";
import OurHome from "@/components/italy/our-home";
import AboutServices from "@/components/italy/about-services";
import Testimonials from "@/components/italy/testimonials";
import Footer from "@/components/italy/footer";
import { useContent } from "@/components/content-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function About() {
  useSeo(PAGE_META.italyAbout);
  const { c } = useContent();

  return (
    <>
      <main>
        <PageHero
          title="About Us"
          backgroundImage={c("italy.villaPhotos.aboutHero")}
          backgroundAlt="Entrance of The Nest Bologna in Italy"
          homeHref="/italy"
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
