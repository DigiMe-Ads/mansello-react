import Hero from "@/components/italy/hero";
import Welcome from "@/components/italy/welcome";
import Steps from "@/components/italy/steps";
import WhyChoose from "@/components/italy/why-choose";
import Testimonials from "@/components/italy/testimonials";
import Adventure from "@/components/italy/adventure";
import LatestNews from "@/components/italy/latest-news";
import Footer from "@/components/italy/footer";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function Home() {
  useSeo(PAGE_META.italyHome);

  return (
    <>
      <main>
        <Hero />
        <Welcome />
        <Steps />
        <WhyChoose />
        <Testimonials />
        <Adventure />
        <LatestNews />
      </main>
      <Footer />
    </>
  );
}
