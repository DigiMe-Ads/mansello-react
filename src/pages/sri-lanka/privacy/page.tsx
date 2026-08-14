import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";

// Sample/placeholder privacy policy, drafted to match how the site actually
// handles data (Stripe payments, marketplace delivery details, Airbnb
// calendar sync, newsletter opt-in) — not reviewed by a lawyer. Have counsel
// check it before this is treated as binding.
const sections: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. Introduction",
    paragraphs: [
      "Mansello (\"we\", \"us\", \"our\") operates Dona's Villa, our marketplace, and this website. We are committed to protecting your privacy in line with Sri Lanka's Personal Data Protection Act No. 9 of 2022 and general data protection best practice.",
    ],
  },
  {
    heading: "2. Data We Collect",
    paragraphs: [
      "Booking details: name, email, phone number, and a valid ID document (type and number) where required.",
      "Marketplace order details: name, phone number, and delivery address, needed to fulfil a cash-on-delivery order.",
      "Payment information: handled directly by Stripe during checkout — we never see or store your full card number.",
      "Anything you send us directly: contact form messages, transport requests, and your email address if you subscribe to our newsletter.",
    ],
  },
  {
    heading: "3. How We Use Your Data",
    paragraphs: [
      "To process and manage your booking or marketplace order, arrange transport if requested, respond to enquiries, send confirmations, and — only if you've opted in — send our newsletter.",
    ],
  },
  {
    heading: "4. Sharing Your Data",
    paragraphs: [
      "We share booking and payment data with Stripe to process payments, share availability (not personal details) with Airbnb to keep our calendars in sync, and share delivery details with couriers where needed to fulfil a marketplace order. We never sell your personal data to third parties.",
    ],
  },
  {
    heading: "5. Data Retention",
    paragraphs: [
      "Booking and order records are retained for as long as needed for accounting, warranty, and legal purposes. Newsletter subscriber data is kept until you unsubscribe. Other enquiry data is retained only as long as needed to respond to and resolve your request.",
    ],
  },
  {
    heading: "6. Your Rights",
    paragraphs: [
      "You may request access to, correction of, or deletion of your personal data at any time by contacting us at info@mansello.com. We will respond to any such request within a reasonable timeframe.",
    ],
  },
  {
    heading: "7. Cookies",
    paragraphs: [
      "This site uses only the essential cookies needed for it to function correctly (e.g. remembering items in your cart, or your session during checkout). We do not use third-party advertising or tracking cookies.",
    ],
  },
  {
    heading: "8. Contact Us",
    paragraphs: [
      "For any privacy-related questions or requests, contact us at info@mansello.com or by post at No. 187, Kepungoda, Pamunugama, Sri Lanka.",
    ],
  },
];

export default function SriLankaPrivacy() {
  return (
    <main>
      <PageHero
        title="Privacy Policy"
        backgroundImage="/images/sri-lanka/airbnb/sri-lanka-home/dona-villa-facade-bright.jpeg"
        backgroundAlt="Facade of Dona's Villa in Pamunugama, Sri Lanka"
        homeHref="/sri-lanka"
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
