"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { submitContactMessage } from "@/lib/api/leads";
import { ApiRequestError } from "@/lib/api/errors";
import type { ContactSubject } from "@/lib/api/types";

const contactItems = [
  {
    icon: Phone,
    label: "Phone",
    value: "+94 74 102 4320",
    href: "tel:+94741024320",
    color: "border-[#153C4D] text-[#153C4D]",
  },
  {
    icon: Mail,
    label: "Email",
    value: "Mansellosrilanka@gmail.com",
    href: "mailto:Mansellosrilanka@gmail.com",
    color: "border-[#E1467C] text-[#E1467C]",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with us",
    href: "https://wa.me/message/TZ6XNDRH3PONM1",
    color: "border-[#8DC63F] text-[#8DC63F]",
  },
  {
    icon: MapPin,
    label: "Address",
    value: (
      <>
        No. 187, Kepungoda,
        <br />
        Pamunugama, Sri Lanka
      </>
    ),
    href: undefined,
    color: "border-[#153C4D] text-[#153C4D]",
  },
];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<ContactSubject | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitContactMessage({ site: "sri_lanka", name, email, subject, message });
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        {/* Map */}
        <div className="overflow-hidden rounded-3xl shadow-lg">
          <iframe
            src="https://www.google.com/maps?q=Pamunugama,Sri+Lanka&output=embed"
            className="h-[320px] w-full border-0 sm:h-[380px]"
            loading="lazy"
            title="Map showing Dona's Villa in Pamunugama, Sri Lanka"
          />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[380px_1fr]">
          {/* Form card */}
          <div className="rounded-[2rem] bg-[#FBECDA] p-8">
            <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
              <span className="text-[#F5A623]">Reach</span>{" "}
              <span className="text-[#153C4D]">&amp; Get in Touch With Us!</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We&apos;d love to hear from you. Whether you&apos;re planning a
              stay at Dona&apos;s Villa, arranging an airport transfer, or
              asking about our Marketplace — the family is always here to
              help.
            </p>

            {sent ? (
              <p className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                Thanks for reaching out — we&apos;ll get back to you soon.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                {error && <p className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
                <input
                  type="text"
                  required
                  placeholder="Enter Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-full bg-white px-5 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
                />
                <input
                  type="email"
                  required
                  placeholder="Enter Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full bg-white px-5 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
                />
                <select
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as ContactSubject)}
                  className="rounded-full bg-white px-5 py-3 text-sm text-slate-400 shadow-sm outline-none"
                >
                  <option value="" disabled>
                    Select Your Subject
                  </option>
                  <option value="room_booking">Room Booking</option>
                  <option value="airport_transfer">Airport Transfer</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  required
                  placeholder="Message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none rounded-3xl bg-white px-5 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-fit rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#72A62E] disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Details */}
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">
              <span className="text-[#153C4D]">Contact Us</span>{" "}
              <span className="text-[#F5A623]">Detail</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
              Travila is a multi-award-winning strategy and content creation
              agency that specializes in travel marketing.
            </p>

            <div className="mt-8 flex flex-col gap-6">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border-[3px] ${item.color}`}
                  >
                    <item.icon size={22} strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-base font-bold text-[#153C4D] hover:underline"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-base font-bold text-[#153C4D]">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p
              className="mt-10 text-3xl sm:text-4xl"
              style={{ fontFamily: "var(--font-script)" }}
            >
              <span className="text-[#153C4D]">Let&apos;s</span>{" "}
              <span className="text-[#F5A623]">Talk</span>{" "}
              <span className="text-[#153C4D]">About You!</span>
            </p>

            <div className="pointer-events-none absolute -bottom-4 right-0 hidden h-64 w-40 sm:block">
              <Image
                src="/images/sri-lanka/contact/form/man-wth-pink-suitcase.webp"
                alt=""
                fill
                sizes="160px"
                className="object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
