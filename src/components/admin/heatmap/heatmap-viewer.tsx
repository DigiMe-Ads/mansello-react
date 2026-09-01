"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_SELECT } from "@/components/admin/input-styles";
import { drawHeatmap, HEAT_LEGEND_CSS_GRADIENT } from "./heat-canvas";
import { KNOWN_PAGES } from "./known-pages";
import { getHeatmapData, listHeatmapPages } from "@/lib/api/heatmap";
import { ApiRequestError } from "@/lib/api/errors";
import { addDaysToKey, formatDisplayDate, todayKey } from "@/lib/date";
import type { HeatmapData, HeatmapDevice, HeatmapPageInfo, Site } from "@/lib/api/types";

// Virtual device-viewport widths the preview iframe is forced to render at,
// so a click captured on a real visitor's phone lands in the same visual
// spot here as it did for them — the site is responsive, so the same URL
// lays out differently at each of these widths.
const DEVICE_FRAME_WIDTH: Record<HeatmapDevice, number> = {
  all: 1440,
  desktop: 1440,
  tablet: 834,
  mobile: 390,
};

const DEVICE_LABELS: Record<HeatmapDevice, string> = {
  all: "All Devices",
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

const RANGE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

// Used only if we can't read the embedded page's real height (e.g. it
// hasn't loaded yet, or same-origin access is ever blocked) — tall enough
// that most pages fit without the heatmap looking truncated.
const FALLBACK_IFRAME_HEIGHT = 2200;

// The preview panel itself stays this tall regardless of how long the real
// page is — a full page can easily be several thousand px tall, and letting
// the panel grow to match would balloon the whole admin dashboard layout to
// match it. Instead the panel scrolls internally, like Plerdy's own
// device-preview panel.
const PREVIEW_MAX_HEIGHT = 640;

export function HeatmapViewer() {
  const { authedFetch } = useAdminAuth();

  const [site, setSite] = useState<Site>("sri_lanka");
  const pagesForSite = useMemo(() => KNOWN_PAGES.filter((p) => p.site === site), [site]);
  const [path, setPath] = useState(pagesForSite[0]?.path ?? "");
  const [device, setDevice] = useState<HeatmapDevice>("all");
  const [rangeDays, setRangeDays] = useState(30);

  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);

  const [iframeHeight, setIframeHeight] = useState(FALLBACK_IFRAME_HEIGHT);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The device frame renders at its real virtual width (e.g. 1440px for
  // desktop) so the page lays out exactly as it did for the visitor whose
  // clicks this is showing — but that's routinely wider than the space
  // available in the admin panel. Rather than let it overflow into a
  // horizontal scrollbar, the whole frame is visually scaled down to fit
  // — like zooming out on a thumbnail — so it always fits with no
  // horizontal scroll at all, at any window size.
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Purely cosmetic — annotates each dropdown option with its click count so
  // an admin can tell at a glance which pages actually have data before
  // picking one. Fails silently (dropdown just shows plain labels) if the
  // backend doesn't have this endpoint yet, same as the main heatmap call.
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    listHeatmapPages(authedFetch, site)
      .then((pages: HeatmapPageInfo[]) => {
        if (cancelled) return;
        setPageCounts(Object.fromEntries(pages.map((p) => [p.path, p.clicks])));
      })
      .catch(() => {
        if (!cancelled) setPageCounts({});
      });
    return () => {
      cancelled = true;
    };
  }, [authedFetch, site]);

  function handleSiteChange(next: Site) {
    setSite(next);
    const firstForSite = KNOWN_PAGES.find((p) => p.site === next);
    if (firstForSite) setPath(firstForSite.path);
  }

  const from = addDaysToKey(todayKey(), -rangeDays);
  const to = todayKey();

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    setError(null);
    setNotReady(false);
    getHeatmapData(authedFetch, { path, device, from, to })
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setNotReady(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load heatmap data");
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authedFetch, path, device, from, to]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Try to size the preview to the real page's full scrollable height, so
  // the heatmap covers the whole page rather than one viewport's worth. This
  // only works because the iframe is same-origin (our own public routes) —
  // stays defensive in case that ever changes (a split marketing domain,
  // say), rather than throwing.
  function handleIframeLoad() {
    try {
      const doc = iframeRef.current?.contentDocument;
      const height = doc?.documentElement?.scrollHeight;
      setIframeHeight(height && height > 200 ? height : FALLBACK_IFRAME_HEIGHT);
    } catch {
      setIframeHeight(FALLBACK_IFRAME_HEIGHT);
    }
  }

  useEffect(() => {
    if (canvasRef.current && data) drawHeatmap(canvasRef.current, data.points, data.maxWeight);
  }, [data, iframeHeight]);

  const frameWidth = DEVICE_FRAME_WIDTH[device];

  // Recompute the fit-to-width scale whenever the available space changes
  // (browser window resize) or a different device width is selected. Never
  // scales up past 1 — a phone-width frame just renders at its real size,
  // centered, rather than being blown up and blurry.
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    function recompute() {
      const available = container!.clientWidth;
      setScale(available > 0 ? Math.min(1, available / frameWidth) : 1);
    }
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [frameWidth]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <select value={site} onChange={(e) => handleSiteChange(e.target.value as Site)} className={ADMIN_SELECT}>
          <option value="italy">Italy site</option>
          <option value="sri_lanka">Sri Lanka site</option>
        </select>

        <select value={path} onChange={(e) => setPath(e.target.value)} className={ADMIN_SELECT}>
          {pagesForSite.map((p) => (
            <option key={p.path} value={p.path}>
              {p.label}
              {pageCounts[p.path] !== undefined ? ` (${pageCounts[p.path].toLocaleString()} clicks)` : ""}
            </option>
          ))}
        </select>

        <select
          value={device}
          onChange={(e) => setDevice(e.target.value as HeatmapDevice)}
          className={ADMIN_SELECT}
        >
          {(Object.keys(DEVICE_LABELS) as HeatmapDevice[]).map((d) => (
            <option key={d} value={d}>
              {DEVICE_LABELS[d]}
            </option>
          ))}
        </select>

        <select value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} className={ADMIN_SELECT}>
          {RANGE_PRESETS.map((r) => (
            <option key={r.days} value={r.days}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={load}
          className="ml-auto rounded-full bg-[#153C4D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38]"
        >
          Refresh
        </button>
      </div>

      {notReady && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Not available yet — the backend doesn&apos;t have this endpoint until
          BACKEND_CHANGES_HEATMAP_ANALYTICS.md is implemented. The click collector on the public site is already
          live and sending clicks; nothing collected once the endpoint ships is lost, but clicks that failed to
          send before then can&apos;t be recovered retroactively.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!notReady && !error && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Total Clicks" value={data ? data.totalClicks.toLocaleString() : "—"} />
            <Stat label="Page Views" value={data ? data.totalPageViews.toLocaleString() : "—"} />
            <Stat label="Date Range" value={`${formatDisplayDate(from)} → ${formatDisplayDate(to)}`} />
            <Stat label="Device" value={DEVICE_LABELS[device]} />
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fewer clicks</span>
            <div className="h-3 flex-1 rounded-full" style={{ background: HEAT_LEGEND_CSS_GRADIENT }} />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">More clicks</span>
          </div>

          <p className="text-xs text-slate-400">
            Shown at {Math.round(scale * 100)}% scale so it always fits with no horizontal scrolling — scroll
            inside the preview below to see the rest of the page, it's capped to a fixed height so it doesn't
            take over the whole dashboard.
          </p>

          {/* This wrapper is what gets measured to decide `scale` — it's a
              plain full-width block with no width of its own opinion, so
              its clientWidth is exactly "however much horizontal space the
              dashboard actually gives this panel" at the current window
              size. */}
          <div ref={previewContainerRef} className="w-full rounded-2xl bg-slate-100 p-6">
            {/* Sized to the frame's SCALED width, which is by construction
                never more than previewContainerRef's own width — this is
                what guarantees zero horizontal scroll at any window size,
                rather than relying on an overflow-x-auto escape hatch. */}
            <div className="relative mx-auto" style={{ width: frameWidth * scale }}>
              <div
                className="overflow-y-auto overflow-x-hidden rounded-xl border border-slate-300 bg-white shadow-lg"
                style={{ width: frameWidth * scale, maxHeight: PREVIEW_MAX_HEIGHT }}
              >
                {/* The "sizer" — its size (already scaled) is what the
                    overflow-y-auto panel above actually scrolls, so the
                    scrollbar's travel matches what's visually shown. */}
                <div className="relative" style={{ width: frameWidth * scale, height: iframeHeight * scale }}>
                  {/* The real content, laid out at its true, un-scaled
                      device width so the page renders exactly as it did for
                      the visitor — then visually shrunk to fit via
                      transform, rather than actually being narrower (which
                      would change how it wraps/reflows). */}
                  <div
                    className="absolute left-0 top-0"
                    style={{ width: frameWidth, height: iframeHeight, transform: `scale(${scale})`, transformOrigin: "top left" }}
                  >
                    <iframe
                      ref={iframeRef}
                      key={path} // force a fresh load (and height re-measure) whenever the page changes
                      src={`${window.location.origin}${path}`}
                      title="Page preview"
                      onLoad={handleIframeLoad}
                      className="pointer-events-none absolute inset-0 border-0"
                      style={{ width: frameWidth, height: iframeHeight }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="pointer-events-none absolute inset-0"
                      style={{ width: frameWidth, height: iframeHeight }}
                    />
                  </div>
                </div>
              </div>

              {loading && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-white/60 text-sm text-slate-500">
                  Loading heatmap...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#153C4D]">{value}</p>
    </div>
  );
}
