import type { ReactNode } from "react";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { useContent } from "@/components/content-provider";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

const EMAIL = (
  <a href="mailto:info@mansello.com" className="font-semibold text-[#153C4D] underline">
    info@mansello.com
  </a>
);

// Marketplace refunds & returns, as supplied by the client (Oct 2026).
type Block = { text: ReactNode } | { list: ReactNode[]; ordered?: boolean } | { subheading: string };

const sections: { heading: string; blocks: Block[] }[] = [
  {
    heading: "Refunds Policy",
    blocks: [
      { subheading: "How and when will I get my refund?" },
      { text: "Refunds can be made in the following situations:" },
      { list: ["Cancelled orders (before shipment);", "Returns (returnable items)."] },
      {
        text: "Your refund will be processed within 7 business days. It will be automatically issued to the original account used to make the purchase.",
      },
    ],
  },
  {
    heading: "Returns Policy — After Order Delivery",
    blocks: [
      { subheading: "How long do I have to make a return?" },
      { text: "15 days after the order is marked as delivered in the tracking page." },
      { subheading: "How do I make a return?" },
      {
        text: (
          <>
            Within 15 days after receiving the order, if you are dissatisfied with it and you want to return any
            item, please contact our Customer Care Team by email at {EMAIL} to begin the process, stating:
          </>
        ),
      },
      {
        ordered: true,
        list: ["The order number;", "The name of the item(s) you wish to return;", "The reason for the return."],
      },
      {
        text: "Our Customer Care Team will review your case and send you all the instructions. The procedure is very simple.",
      },
      {
        text: "For returns by standard shipping, please note that it is essential that you provide us the tracking number of your return to guarantee that it is cleared as a return and no taxes are applied.",
      },
      { text: "Once it arrives at our facilities, the item(s) will be refunded within a maximum of 7 working days." },
      { text: <strong className="text-slate-700">Important note: we do not work with exchanges, only returns.</strong> },
    ],
  },
  {
    heading: "Returnable Items",
    blocks: [
      {
        list: [
          "Products unopened, unused and sealed in their original packaging, including the protective cellophane or labels (if any);",
          "Faulty, damaged, or broken items during transportation.",
        ],
      },
      { subheading: "Faulty, damaged, or broken items during transportation" },
      {
        text: "If an item arrives faulty, damaged, or broken during transportation, the customer must provide clear photographic evidence of the damage, including the product and its packaging, at the time of delivery.",
      },
      {
        text: "Customers are advised to inspect the package upon receipt and document any visible damage before accepting the delivery from the courier. Photographic evidence may be required to assess the claim and determine eligibility for a refund or replacement.",
      },
    ],
  },
  {
    heading: "Non-returnable Items",
    blocks: [
      {
        list: [
          "Products purchased in a promotion for nearing their expiry date;",
          "Opened or used products;",
          "Any issue with the products detected after the 15 days from delivery have passed.",
        ],
      },
    ],
  },
  {
    heading: "Return Shipping Fees",
    blocks: [
      {
        text: "Shipping fees to return the items are at the customer's own expense (excluding situations of wrong or damaged items).",
      },
      {
        text: "Return by standard mail: please consult your local post office to confirm the actual return shipping fee. We advise you to use the cheapest registered (with tracking) method available. You need to provide us the return tracking number.",
      },
    ],
  },
  {
    heading: "Return Restrictions Before Delivery",
    blocks: [
      {
        text: "Mansello is not responsible for any customs duties, import taxes, or other charges imposed by the destination country. These charges are the customer's responsibility.",
      },
      {
        text: "In some countries, customs regulations may prevent an order from being returned before customs clearance is completed and the applicable duties and taxes have been paid.",
      },
      {
        text: "If a customer refuses to pay the required customs duties or import taxes, customs authorities may refuse to return the shipment to the sender, and the parcel may be destroyed or abandoned.",
      },
      {
        text: "In such cases, Mansello will not be responsible for the loss of the shipment and will not issue a refund if the parcel cannot be returned due to the customer's refusal to pay the applicable customs duties or taxes.",
      },
      {
        text: "By placing an order, the customer acknowledges that they are responsible for any applicable customs duties, import taxes, and related charges required to receive the shipment.",
      },
    ],
  },
];

function renderBlock(block: Block, i: number) {
  if ("subheading" in block) {
    return (
      <h3 key={i} className="mt-5 text-base font-semibold text-[#153C4D]">
        {block.subheading}
      </h3>
    );
  }
  if ("list" in block) {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag
        key={i}
        className={`mt-3 space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 ${block.ordered ? "list-decimal" : "list-disc"}`}
      >
        {block.list.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ListTag>
    );
  }
  return (
    <p key={i} className="mt-3 text-sm leading-relaxed text-slate-600">
      {block.text}
    </p>
  );
}

export default function SriLankaRefundPolicy() {
  useSeo(PAGE_META.sriLankaRefundPolicy);
  const { c } = useContent();

  return (
    <>
      <main>
        <PageHero
          title="Refunds & Returns Policy"
          backgroundImage={c("sri_lanka.villaPhotos.heroImage")}
          backgroundAlt="Facade of Dona's Villa in Pamunugama, Sri Lanka"
          homeHref="/sri-lanka"
        />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs uppercase tracking-wide text-slate-400">Last updated: October 19, 2026</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              This policy applies to orders placed through the Mansello Marketplace. For villa booking
              cancellations, see our{" "}
              <Link href="/sri-lanka/terms" className="font-semibold text-[#153C4D] underline">
                Terms &amp; Conditions
              </Link>
              .
            </p>

            {sections.map((s) => (
              <div key={s.heading} className="mt-10">
                <h2 className="text-xl font-bold text-[#153C4D]">{s.heading}</h2>
                {s.blocks.map(renderBlock)}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
