import Hero from "@/components/sri-lanka/hero";
import Welcome from "@/components/sri-lanka/welcome";
import Services from "@/components/sri-lanka/services";
import Steps from "@/components/sri-lanka/steps";
import WhyChoose from "@/components/sri-lanka/why-choose";
import Testimonials from "@/components/sri-lanka/testimonials";
import Adventure from "@/components/sri-lanka/adventure";
import LatestNews from "@/components/sri-lanka/latest-news";
import Footer from "@/components/sri-lanka/footer";

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