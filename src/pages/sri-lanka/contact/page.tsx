import PageHero from "@/components/page-hero";
import ContactForm from "@/components/sri-lanka/contact-form";
import Footer from "@/components/sri-lanka/footer";

export default function Contact() {
  return (
    <main>
      <PageHero
        title="Contact"
        backgroundImage="/images/sri-lanka/contact/hero-contact.webp"
        backgroundAlt="F9 arches train passing through a lush green landscape in Sri Lanka"
        homeHref="/sri-lanka"
      />
      <ContactForm />
      <Footer />
    </main>
  );
}