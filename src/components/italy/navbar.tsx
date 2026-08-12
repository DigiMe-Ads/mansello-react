"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { SiteSearch, type SearchablePage } from "@/components/site-search";

const leftLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/italy/about" },
  { label: "BnB", href: "/italy/airbnb" },
];

const rightLinks = [{ label: "Contact", href: "/italy/contact" }];

const searchablePages: SearchablePage[] = [
  { title: "Home", description: "The Nest Bologna — Bed & Breakfast in Bologna", href: "/" },
  { title: "About", description: "Our story and the two Mansello homes", href: "/italy/about" },
  { title: "BnB", description: "Rooms, pricing and live availability", href: "/italy/airbnb" },
  { title: "Contact", description: "Get in touch or send a message", href: "/italy/contact" },
  { title: "Blog", description: "Tips, guides and stories from Bologna", href: "/italy/blog" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-1/2 z-50 w-[92%] max-w-6xl -translate-x-1/2">
      <div className="relative flex h-[90px] items-center justify-between rounded-[20px] bg-white/95 px-8 shadow-lg backdrop-blur-sm sm:h-[100px] sm:px-12">
        {/* Left links */}
        <nav className="hidden items-center gap-8 md:flex">
          {leftLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#1F3D2E]/80 transition hover:text-[#8DC63F]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Reserves space so the logo badge below has room on mobile */}
        <div className="w-10 md:hidden" />

        {/* Right links + icons */}
        <div className="hidden items-center gap-8 md:flex">
          {rightLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#1F3D2E]/80 transition hover:text-[#8DC63F]"
            >
              {link.label}
            </Link>
          ))}
          <SiteSearch pages={searchablePages} showLabel />
          <button aria-label="Menu" className="text-[#1F3D2E]/80 transition hover:text-[#8DC63F]">
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="text-[#1F3D2E]/80 md:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo badge — hangs off the bottom edge only, centered horizontally */}
        <div className="pointer-events-none absolute left-1/2 top-full h-28 w-28 -translate-x-1/2 -translate-y-3/4 rounded-full bg-white/95 sm:h-52 sm:w-52">
          <Image
            src="/images/logo.webp"
            alt="Mansello"
            fill
            sizes="(min-width: 640px) 208px, 112px"
            className="object-contain p-3"
          />
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mt-3 flex flex-col gap-1 rounded-[20px] bg-white/95 p-4 shadow-lg md:hidden">
          {[...leftLinks, ...rightLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[#1F3D2E]/80 hover:bg-[#F7F5F0]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
