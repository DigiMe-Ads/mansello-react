import Hero from "@/components/italy/hero";
import Welcome from "@/components/italy/welcome";
import Services from "@/components/italy/services";
import Steps from "@/components/italy/steps";
import WhyChoose from "@/components/italy/why-choose";
import Testimonials from "@/components/italy/testimonials";
import Adventure from "@/components/italy/adventure";
import LatestNews from "@/components/italy/latest-news";
import Footer from "@/components/italy/footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Welcome />
        <Services />
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
