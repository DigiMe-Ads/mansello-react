"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSiteContent } from "@/lib/api/content";
import { CONTENT_DEFAULTS, contentLines } from "@/lib/content/schema";

// Makes admin-edited site content available to every public component, with
// the hardcoded defaults from schema.ts as the fallback.
//
// The fallback is the important part: this provider never blocks rendering and
// never shows an error. If the endpoint 404s (not built yet), the network
// fails, or a key has simply never been edited, `c()` returns the original
// hardcoded value — so the site looks exactly as it did before this feature
// existed. That is deliberate: a CMS outage must not blank the marketing site.

type ContentMap = Record<string, string>;

interface ContentState {
  /** Value for a key, falling back to the built-in default. */
  c: (key: string) => string;
  /** Newline-separated field as a list (e.g. the welcome highlights). */
  cList: (key: string) => string[];
  /** True once the fetch has settled — useful only for admin previews. */
  loaded: boolean;
}

const ContentContext = createContext<ContentState | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<ContentMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSiteContent()
      .then((entries) => {
        if (cancelled) return;
        const map: ContentMap = {};
        for (const e of entries) {
          // An empty saved value means "cleared" — fall back to the default
          // rather than rendering a blank heading.
          if (e.value?.trim()) map[e.key] = e.value;
        }
        setOverrides(map);
      })
      .catch(() => {
        // Endpoint missing or unreachable — defaults are already correct.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ContentState>(() => {
    const c = (key: string) => overrides[key] ?? CONTENT_DEFAULTS[key] ?? "";
    return { c, cList: (key: string) => contentLines(c(key)), loaded };
  }, [overrides, loaded]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const ctx = useContext(ContentContext);
  // Usable outside the provider (tests, isolated renders) — falls back to
  // defaults rather than throwing, since content is never load-bearing.
  if (!ctx) {
    const c = (key: string) => CONTENT_DEFAULTS[key] ?? "";
    return { c, cList: (key: string) => contentLines(c(key)), loaded: true };
  }
  return ctx;
}
