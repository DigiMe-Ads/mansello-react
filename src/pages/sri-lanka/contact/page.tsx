import PageHero from "@/components/page-hero";
import ContactForm from "@/components/sri-lanka/contact-form";
import Footer from "@/components/sri-lanka/footer";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function Contact() {
  useSeo(PAGE_META.sriLankaContact);

  return (
    <>
      <main>
        <PageHero
          title="Contact"
          backgroundImage="/images/sri-lanka/contact/hero-contact.webp"
          backgroundAlt="F9 arches train passing through a lush green landscape in Sri Lanka"
          homeHref="/sri-lanka"
        />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}