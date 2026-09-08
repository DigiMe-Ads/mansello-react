import PageHero from "@/components/italy/page-hero";
import ContactForm from "@/components/italy/contact-form";
import Footer from "@/components/italy/footer";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function Contact() {
  useSeo(PAGE_META.italyContact);

  return (
    <>
      <main>
        <PageHero
          title="Contact"
          backgroundImage="/images/italy/nest-bologna/nest-bologna-exterior-1.webp"
          backgroundAlt="Entrance of The Nest Bologna in Bologna, Italy"
          homeHref="/italy"
        />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
