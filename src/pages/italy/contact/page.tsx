import PageHero from "@/components/italy/page-hero";
import ContactForm from "@/components/italy/contact-form";
import Footer from "@/components/italy/footer";

export default function Contact() {
  return (
    <main>
      <PageHero
        title="Contact"
        backgroundImage="/images/italy/nest-bologna/nest-bologna-exterior-1.webp"
        backgroundAlt="Entrance of The Nest Bologna in Bologna, Italy"
        homeHref="/italy"
      />
      <ContactForm />
      <Footer />
    </main>
  );
}
