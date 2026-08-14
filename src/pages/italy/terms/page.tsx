import PageHero from "@/components/italy/page-hero";
import Footer from "@/components/italy/footer";

// Sample/placeholder terms — written to reflect how the site and booking
// flow actually work (hold windows, cancellation tiers, city tax, etc.), but
// this has not been reviewed by a lawyer. Have counsel check it before this
// page is treated as the site's real, binding terms.
const sections: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. Introduction",
    paragraphs: [
      "These Terms & Conditions govern your use of this website and any booking made for a stay at The Nest Bologna, operated by Mansello (\"we\", \"us\", \"our\"). By browsing this site, making an enquiry, or completing a booking, you agree to these terms.",
    ],
  },
  {
    heading: "2. Bookings & Reservations",
    paragraphs: [
      "When you start checkout, your selected dates are held for 15 minutes while payment is completed. A booking is only confirmed once payment has been successfully processed — an incomplete payment does not guarantee your dates.",
      "You must provide accurate guest details at the time of booking, including a valid form of identification, as required for guest registration under Italian law.",
    ],
  },
  {
    heading: "3. Cancellations & Refunds",
    paragraphs: [
      "Cancellations made 7 or more days before check-in receive a full refund. Cancellations made between 3 and 7 days before check-in receive a 50% refund. Cancellations made within 72 hours of check-in are non-refundable.",
      "Refunds are issued to the original payment method. Approved refunds are typically processed within 5–10 business days, depending on your bank or card issuer.",
    ],
  },
  {
    heading: "4. Pricing & City Tax",
    paragraphs: [
      "Room rates are shown in euros (€) and are exclusive of Bologna's municipal tourist tax (imposta di soggiorno), which is added per guest, per night, up to a maximum of 5 nights per stay. Guests under 14 years old are exempt from this tax.",
    ],
  },
  {
    heading: "5. Airport Transfers & Transport",
    paragraphs: [
      "Fixed-price and custom-quote transport services (e.g. airport pick-up/drop-off) are optional add-ons, arranged separately from your room booking and confirmed directly by our team.",
    ],
  },
  {
    heading: "6. Payments",
    paragraphs: [
      "All online payments are processed securely through Stripe. We do not collect or store your full card details on our servers.",
    ],
  },
  {
    heading: "7. Guest Responsibilities",
    paragraphs: [
      "Guests are expected to treat the property with care and respect check-in/check-out times, house rules, and neighbours. Guests are responsible for any damage caused to the property during their stay beyond normal wear and tear.",
    ],
  },
  {
    heading: "8. Limitation of Liability",
    paragraphs: [
      "While we take reasonable care to keep this website and the information on it accurate and up to date, we make no warranties about its completeness and accept no liability for indirect or consequential loss arising from its use.",
    ],
  },
  {
    heading: "9. Governing Law",
    paragraphs: [
      "These terms are governed by the laws of Italy. Any disputes will be subject to the exclusive jurisdiction of the Italian courts.",
    ],
  },
  {
    heading: "10. Changes to These Terms",
    paragraphs: [
      "We may update these terms from time to time. Changes take effect once posted on this page; the \"Last updated\" date below reflects the most recent revision.",
    ],
  },
  {
    heading: "11. Contact Us",
    paragraphs: [
      "Questions about these terms? Reach us at info@mansello.com, by phone at +39 380 348 8663, or by post at Via Alfredo Calzolari 12, 40128 Bologna, Italy.",
    ],
  },
];

export default function ItalyTerms() {
  return (
    <main>
      <PageHero
        title="Terms & Conditions"
        backgroundImage="/images/italy/nest-bologna/nest-bologna-exterior-1.webp"
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

      <Footer />
    </main>
  );
}
