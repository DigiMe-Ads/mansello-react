// Site-wide click capture that feeds the admin "Heatmap" tab (see
// src/pages/admin/(protected)/heatmap/page.tsx and
// BACKEND_CHANGES_HEATMAP_ANALYTICS.md). Mounted once near the root of the
// app (see App.tsx) and deliberately skips every /admin/* route — this is a
// heatmap of what real guests do on the public site, not of staff using the
// dashboard.
//
// Every click becomes a normalized, resolution-independent point (a 0–1
// fraction of the page's rendered width/height, not raw pixels) plus a
// coarse device bucket, batched in memory, and flushed with
// `navigator.sendBeacon` so it survives the visitor navigating away or
// closing the tab. This must never be able to break the site for a real
// visitor — every failure path below is swallowed silently, including the
// endpoint simply not existing yet on the backend.

import type { ClickEventInput, HeatmapDevice, Site } from "@/lib/api/types";
import { KNOWN_PAGES } from "@/components/admin/heatmap/known-pages";

const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 50;
const MAX_QUEUE_SIZE = 200; // back-pressure: drop new clicks past this rather than grow unbounded
const SESSION_KEY = "mansello_hm_sid";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private browsing / storage disabled — a per-call id just means this
    // click won't dedupe into the same session as the rest of the visit.
    return crypto.randomUUID();
  }
}

function deviceBucket(viewportWidth: number): Exclude<HeatmapDevice, "all"> {
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1280) return "tablet";
  return "desktop";
}

function siteFor(pathname: string): Site | null {
  if (pathname.startsWith("/italy")) return "italy";
  if (pathname.startsWith("/sri-lanka")) return "sri_lanka";
  return null; // homepage, /booking-info/:token, etc. — not part of either site's heatmap
}

// Paths whose heatmap the admin can actually render. Recording anything else
// is not just useless — it is unsafe: pathnames on the dynamic routes carry
// secrets. `/booking-info/<token>` holds the single credential guarding a
// guest's details and passport uploads, and `/sri-lanka/marketplace/order/<id>`
// identifies a customer's order. Both would otherwise be posted verbatim to
// the unauthenticated click-events endpoint and stored in the analytics table.
const TRACKABLE_PATHS = new Set(KNOWN_PAGES.map((p) => p.path));

function isTrackablePath(pathname: string): boolean {
  // Tolerate a trailing slash so /italy/ and /italy are the same page.
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return TRACKABLE_PATHS.has(normalized);
}

// Best-effort, short, human-glanceable description of what was clicked —
// purely informational (an optional "top clicked elements" list on the
// backend side), never required for the heatmap dots themselves. Never
// includes text content, which could be guest-entered PII.
function describeTarget(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const cls =
    typeof el.className === "string" && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
  return `${tag}${id}${cls}`.slice(0, 80);
}

function apiBase(): string | null {
  try {
    return process.env.NEXT_PUBLIC_API_URL ?? null;
  } catch {
    return null;
  }
}

let queue: ClickEventInput[] = [];
let started = false;

function flush(useBeacon: boolean) {
  if (queue.length === 0) return;
  const base = apiBase();
  if (!base) {
    queue = [];
    return;
  }

  const batch = queue;
  queue = [];
  const body = JSON.stringify({ events: batch });
  const url = `${base}/api/analytics/click-events`;

  try {
    if (useBeacon && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (sent) return;
      // Beacon queue was full/refused — fall through and try a normal
      // fetch instead, best-effort.
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Analytics failures must never surface to a real visitor.
    });
  } catch {
    // Same — e.g. sendBeacon throwing in an unsupported embedded context.
  }
}

function isTrackingDisabled(): boolean {
  return navigator.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
}

/**
 * Starts the global click listener. Safe to call multiple times — only the
 * first call does anything. No-ops entirely if Do Not Track is enabled.
 */
export function initClickHeatmapTracker() {
  if (typeof window === "undefined" || started) return;
  if (isTrackingDisabled()) return;
  started = true;

  const onClick = (e: MouseEvent) => {
    if (window.location.pathname.startsWith("/admin")) return;
    if (!isTrackablePath(window.location.pathname)) return;
    if (queue.length >= MAX_QUEUE_SIZE) return;

    const doc = document.documentElement;
    const pageWidth = doc.scrollWidth || window.innerWidth;
    const pageHeight = doc.scrollHeight || window.innerHeight;
    if (pageWidth === 0 || pageHeight === 0) return;

    const target = e.target instanceof Element ? e.target : null;

    queue.push({
      site: siteFor(window.location.pathname),
      path: window.location.pathname,
      xPct: Math.min(1, Math.max(0, e.pageX / pageWidth)),
      yPct: Math.min(1, Math.max(0, e.pageY / pageHeight)),
      viewportWidth: window.innerWidth,
      device: deviceBucket(window.innerWidth),
      sessionId: getSessionId(),
      targetSelector: target ? describeTarget(target) : undefined,
      occurredAt: new Date().toISOString(),
    });

    if (queue.length >= MAX_BATCH_SIZE) flush(false);
  };

  document.addEventListener("click", onClick, { capture: true, passive: true });
  setInterval(() => flush(false), FLUSH_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}
