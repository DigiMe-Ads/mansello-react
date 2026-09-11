import PageHero from "@/components/italy/page-hero";
import ContactForm from "@/components/italy/contact-form";
import Footer from "@/components/italy/footer";
import { useContent } from "@/components/content-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function Contact() {
  useSeo(PAGE_META.italyContact);
  const { c } = useContent();

  return (
    <>
      <main>
        <PageHero
          title="Contact"
          backgroundImage={c("italy.villaPhotos.heroImage")}
          backgroundAlt="Entrance of The Nest Bologna in Bologna, Italy"
          homeHref="/italy"
        />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
