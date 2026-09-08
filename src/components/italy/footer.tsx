"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import { Home, Mail, Phone, Search } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/api/leads";
import { ApiRequestError } from "@/lib/api/errors";
import { ITALY_DESTINATIONS } from "@/lib/destinations";

const exploreLinks = [
  { label: "About us", href: "/italy/about" },
  { label: "Apartment", href: "/italy/airbnb" },
  { label: "News", href: "/italy/blog" },
];
const legalLinks = [
  { label: "Terms & Condition", href: "/italy/terms" },
  { label: "Privacy Policy", href: "/italy/privacy" },
  { label: "Contact", href: "/italy/contact" },
  // Careers & Help don't have pages yet, so they're left unlinked below.
  // { label: "Careers", href: null },
  // { label: "Help", href: null },
];

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.17 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34v7.03C18.34 21.23 22 17.06 22 12.06Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.83.48 3.55 1.4 5.09L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.19 1.24-1.95 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.17-4.94-4.36-.14-.19-1.19-1.58-1.19-3.02s.75-2.14 1.02-2.44c.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.29.7 1.16 1.51 1.88 1.04.93 1.91 1.22 2.19 1.36.29.14.46.12.63-.07.17-.19.71-.83.9-1.11.19-.29.38-.24.63-.14.26.09 1.65.78 1.94.92.28.14.47.21.53.33.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);
    try {
      await subscribeToNewsletter({ email, site: "italy" });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="relative overflow-hidden bg-white">
      {/* Subscribe banner */}
      <div className="mx-auto max-w-6xl px-6 pt-12 sm:px-12 lg:px-20">
        <div className="flex flex-col gap-6 rounded-3xl bg-[#F5A623] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h2 className="text-4xl leading-none sm:text-5xl">
              <span
                className="text-black"
                style={{ fontFamily: "var(--font-script)" }}
              >
                Subscribe
              </span>{" "}
              <span
                className="text-white"
                style={{ fontFamily: "var(--font-script)" }}
              >
                Now!
              </span>
            </h2>
            <p className="mt-3 text-sm text-white/90">
              Sign up to searing weekly newsletter to get the latest updates.
            </p>
            {status === "success" && (
              <p className="mt-2 text-sm font-semibold text-white">Thanks for subscribing!</p>
            )}
            {status === "error" && errorMessage && (
              <p className="mt-2 text-sm font-semibold text-white">{errorMessage}</p>
            )}
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex w-full items-center justify-between gap-2 rounded-full bg-black py-1.5 pl-6 pr-1.5 sm:w-auto sm:min-w-[360px]"
          >
            <input
              type="email"
              required
              placeholder="Email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              disabled={submitting}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-60"
            >
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Palm-silhouette footer body */}
      <div className="relative mt-10 bg-[#DCEEEA]">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/images/background-footer.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-14 pt-16 sm:px-12 lg:px-20">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr]">
            {/* Logo column */}
            <div>
              <div className="relative h-16 w-40">
                <Image
                  src="/images/logo.webp"
                  alt="Mansello"
                  fill
                  sizes="160px"
                  className="object-contain object-left"
                />
              </div>
              <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-slate-600">
                Family-run apartment in Bologna with transparent pricing and a cosy home-away-from-home feel.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="https://www.facebook.com/share/1BnvnhryFX/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#F5A623] text-black transition hover:bg-[#F5A623] hover:text-white"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/thenestbologna?utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#F5A623] text-black transition hover:bg-[#F5A623] hover:text-white"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://wa.me/393803488663"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#F5A623] text-black transition hover:bg-[#F5A623] hover:text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-lg font-bold text-[#153C4D]">Explore</h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                {exploreLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition hover:text-[#153C4D]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Destinations */}
            <div>
              <h3 className="text-lg font-bold text-[#153C4D]">
                Destinations
              </h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                {ITALY_DESTINATIONS.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/italy/destinations/${d.slug}`} className="transition hover:text-[#153C4D]">
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-bold text-[#153C4D]">Legal</h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                {legalLinks.map((l) =>
                  l.href ? (
                    <li key={l.label}>
                      <Link href={l.href} className="transition hover:text-[#153C4D]">
                        {l.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={l.label} className="text-slate-400">
                      {l.label}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm">
                  <Phone size={16} className="text-[#153C4D]" />
                </span>
                <a
                  href="tel:+393803488663"
                  className="whitespace-nowrap text-xl text-[#F5A623]"
                  style={{ fontFamily: "var(--font-script)" }}
                >
                  +39 380 348 8663
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm">
                  <Mail size={16} className="text-[#153C4D]" />
                </span>
                <a href="mailto:info@mansello.com" className="text-sm text-slate-700">
                  info@mansello.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-sm">
                  <Home size={16} className="text-[#153C4D]" />
                </span>
                <span className="text-sm text-slate-700">
                  Via Alfredo Calzolari 12,
                  <br />
                  40128 Bologna, Italy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                CIR: 037006-AT-04671
                <br />
                CIN: IT037006C2EECVHFLU
              </p>
            </div>
          </div>

          <p className="mt-14 border-t border-[#153C4D]/10 pt-10 text-center text-sm text-slate-500">
            © 2026 Mansello All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
