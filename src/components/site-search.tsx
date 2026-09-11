"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface SearchablePage {
  title: string;
  description: string;
  href: string;
}

// Client-side site search — no backend needed, just filters a small list of
// known pages by title/description. Works identically on both sites; each
// navbar passes in its own page list.
export function SiteSearch({ pages, showLabel = false }: { pages: SearchablePage[]; showLabel?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = query.trim()
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  function goTo(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) goTo(results[0].href);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[#1F3D2E]/80 transition hover:text-[#8DC63F]"
      >
        <Search size={18} />
        {showLabel && <span className="text-sm font-medium">Search</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl bg-white p-3 shadow-lg">
          <form onSubmit={handleSubmit}>
            <label htmlFor="site-search-input" className="sr-only">
              Search the site
            </label>
            <input
              ref={inputRef}
              id="site-search-input"
              name="q"
              type="text"
              placeholder="Search the site..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8DC63F]"
            />
          </form>
          {query.trim() && (
            <div className="mt-2 flex flex-col gap-1">
              {results.length === 0 && <p className="px-2 py-2 text-xs text-slate-400">No pages found.</p>}
              {results.map((p) => (
                <button
                  key={p.href}
                  type="button"
                  onClick={() => goTo(p.href)}
                  className="rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="block font-semibold text-[#153C4D]">{p.title}</span>
                  <span className="block text-xs text-slate-400">{p.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
