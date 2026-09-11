import PageHero from "@/components/italy/page-hero";
import Footer from "@/components/italy/footer";
import { useContent } from "@/components/content-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

// Sample/placeholder privacy policy, drafted to match how the site actually
// handles data (Stripe payments, guest ID capture, Airbnb calendar sync,
// newsletter opt-in) — not reviewed by a lawyer. Have counsel check it,
// especially the GDPR sections, before this is treated as binding.
const sections: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. Introduction",
    paragraphs: [
      "Mansello (\"we\", \"us\", \"our\") operates The Nest Bologna and this website. We are committed to protecting your privacy in line with the EU General Data Protection Regulation (GDPR) and Italian data protection law.",
    ],
  },
  {
    heading: "2. Data We Collect",
    paragraphs: [
      "Booking details: name, email, phone number, and a valid ID document (type and number), collected for guest registration as required by Italian law.",
      "Payment information: handled directly by Stripe during checkout — we never see or store your full card number.",
      "Anything you send us directly: contact form messages, transport requests, and your email address if you subscribe to our newsletter.",
    ],
  },
  {
    heading: "3. How We Use Your Data",
    paragraphs: [
      "To process and manage your booking, arrange transport if requested, respond to enquiries, send booking confirmations and any pre-arrival information requests, and — only if you've opted in — send our newsletter.",
    ],
  },
  {
    heading: "4. Legal Basis for Processing",
    paragraphs: [
      "We process your data under one or more of: performance of a contract (your booking), a legal obligation (guest registration requirements), your consent (newsletter sign-up), and our legitimate interest in running and improving the property and this website.",
    ],
  },
  {
    heading: "5. Sharing Your Data",
    paragraphs: [
      "We share booking and payment data with Stripe to process payments, and share availability (not personal details) with Airbnb to keep our calendars in sync. Guest registration data may be shared with local authorities where legally required. We never sell your personal data to third parties.",
    ],
  },
  {
    heading: "6. Data Retention",
    paragraphs: [
      "Guest registration records are retained for the period required under Italian law. Newsletter subscriber data is kept until you unsubscribe. Other enquiry data is retained only as long as needed to respond to and resolve your request.",
    ],
  },
  {
    heading: "7. Your Rights",
    paragraphs: [
      "Under GDPR, you have the right to access, correct, delete, or export your personal data, and to object to or restrict certain processing. To exercise any of these rights, contact us at info@mansello.com. You also have the right to lodge a complaint with the Garante per la protezione dei dati personali, Italy's data protection authority.",
    ],
  },
  {
    heading: "8. Cookies",
    paragraphs: [
      "This site uses only the essential cookies needed for it to function correctly (e.g. remembering your session during checkout). We do not use third-party advertising or tracking cookies.",
    ],
  },
  {
    heading: "9. Contact Us",
    paragraphs: [
      "For any privacy-related questions or requests, contact us at info@mansello.com or by post at Via Alfredo Calzolari 12, 40128 Bologna, Italy.",
    ],
  },
];

export default function ItalyPrivacy() {
  useSeo(PAGE_META.italyPrivacy);
  const { c } = useContent();

  return (
    <>
      <main>
        <PageHero
          title="Privacy Policy"
          backgroundImage={c("italy.villaPhotos.heroImage")}
          backgroundAlt="Entrance of The Nest Bologna in Bologna, Italy"
          homeHref="/italy"
        />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Last updated: August 14, 2026
            </p>

            {sections.map((s) => (
              <div key={s.heading} className="mt-8 first:mt-0">
                <h2 className="text-xl font-bold text-[#153C4D]">{s.heading}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="mt-3 text-sm leading-relaxed text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
