import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { HeatmapData, HeatmapDevice, HeatmapPageInfo, Site } from "./types";

// Not in API_DOCUMENTATION.md yet — spec'd in
// BACKEND_CHANGES_HEATMAP_ANALYTICS.md. Click *ingestion* happens directly
// from src/lib/analytics/click-tracker.ts (unauthenticated, fire-and-forget
// from the public site) — these two calls are only the admin-side reads,
// which is why they go through the normal authedFetch like everything else
// in this admin dashboard.

export function listHeatmapPages(fetcher: AuthedFetch, site?: Site) {
  const qs = site ? `?site=${site}` : "";
  return fetcher<HeatmapPageInfo[]>(`/api/analytics/heatmap/pages${qs}`);
}

export interface CountryReach {
  /** ISO alpha-2 code, or null for visits with no country. Sorted by visitors. */
  countries: { country: string | null; visitors: number; clicks: number }[];
  trackingSince: string | null;
}

export function getCountryReach(fetcher: AuthedFetch, params: { site?: Site; from: string; to: string }) {
  const qs = new URLSearchParams({ from: params.from, to: params.to });
  if (params.site) qs.set("site", params.site);
  return fetcher<CountryReach>(`/api/analytics/countries?${qs.toString()}`);
}

export function getHeatmapData(
  fetcher: AuthedFetch,
  params: { path: string; device: HeatmapDevice; from: string; to: string }
) {
  const qs = new URLSearchParams({
    path: params.path,
    device: params.device,
    from: params.from,
    to: params.to,
  });
  return fetcher<HeatmapData>(`/api/analytics/heatmap?${qs.toString()}`);
}
