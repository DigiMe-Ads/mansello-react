"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT } from "@/components/admin/input-styles";
import { getCountryReach, type CountryReach } from "@/lib/api/heatmap";
import { addDaysToKey, todayKey } from "@/lib/date";

// Which countries the sites reached: visitors (sessions that clicked) per
// country, from each visitor's device timezone — see the backend's
// countryForTimeZone. Approximate, and only covers visits since countries
// started being recorded.

const countryNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;

function countryName(code: string | null) {
  if (!code) return "Unknown";
  try {
    return countryNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "LK" → 🇱🇰 (regional indicator letters). */
function flag(code: string | null) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

type SiteFilter = "all" | "italy" | "sri_lanka";

export function CountryReachPanel() {
  const { authedFetch } = useAdminAuth();
  const [site, setSite] = useState<SiteFilter>("all");
  const [from, setFrom] = useState(addDaysToKey(todayKey(), -30));
  const [to, setTo] = useState(todayKey());
  const [data, setData] = useState<CountryReach | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getCountryReach(authedFetch, { site: site === "all" ? undefined : site, from, to })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load countries");
      });
    return () => {
      cancelled = true;
    };
  }, [authedFetch, site, from, to]);

  const known = useMemo(() => (data?.countries ?? []).filter((c) => c.country), [data]);
  const unknown = data?.countries.find((c) => !c.country);
  const total = known.reduce((n, c) => n + c.visitors, 0);
  const max = Math.max(1, ...known.map((c) => c.visitors));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#153C4D]">Countries reached</h2>
          <p className="mt-1 max-w-xl text-xs text-slate-500">
            Visitors per country, worked out from each visitor&apos;s device time zone (no IP addresses are stored).
            Counts visits where someone clicked at least once
            {data?.trackingSince
              ? `, recorded since ${new Date(data.trackingSince).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
              : " — recording starts with this update"}
            .
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <select
            aria-label="Site"
            value={site}
            onChange={(e) => setSite(e.target.value as SiteFilter)}
            className={ADMIN_SELECT}
          >
            <option value="all">Both sites</option>
            <option value="italy">Italy</option>
            <option value="sri_lanka">Sri Lanka</option>
          </select>
          <input type="date" aria-label="From" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={ADMIN_INPUT} />
          <input type="date" aria-label="To" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={ADMIN_INPUT} />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="mt-4 text-sm text-slate-500">Loading...</p>}

      {data && known.length === 0 && (
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No country data for this period yet{data.trackingSince ? "" : " — it will fill in as new visitors arrive"}.
        </p>
      )}

      {known.length > 0 && (
        <>
          <p className="mt-5 text-sm text-slate-600">
            <strong className="text-[#153C4D]">{known.length}</strong> countr{known.length === 1 ? "y" : "ies"} ·{" "}
            <strong className="text-[#153C4D]">{total}</strong> visitor{total === 1 ? "" : "s"}
            {unknown && <span className="text-slate-400"> (+{unknown.visitors} with no country)</span>}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {known.map((c) => (
              <li key={c.country} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate text-slate-700">
                  <span className="mr-2" aria-hidden>
                    {flag(c.country)}
                  </span>
                  {countryName(c.country)}
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-[#8DC63F]"
                    style={{ width: `${(c.visitors / max) * 100}%` }}
                  />
                </span>
                <span className="w-28 text-right tabular-nums text-slate-600">
                  {c.visitors} visitor{c.visitors === 1 ? "" : "s"}
                  <span className="ml-1 text-xs text-slate-400">({Math.round((c.visitors / total) * 100)}%)</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
