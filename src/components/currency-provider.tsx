"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import { formatMoney } from "@/lib/currency";

// Display-only currency conversion. Guests are always CHARGED in the
// currency the backend prices in (EUR for Bologna, USD for Sri Lanka and the
// marketplace); this only re-expresses prices so visitors get a feel for the
// cost in a currency they know. Nothing here is sent to the backend.
//
// Rates: ExchangeRate-API's free open endpoint (no key, CORS-enabled,
// refreshed daily; their terms ask for the attribution link shown in the
// switcher). Cached in localStorage for 12h so it's one request per visitor
// per half-day. If rates can't be loaded, every price simply shows in its
// original currency.

export const DISPLAY_CURRENCIES = ["USD", "EUR", "LKR"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const RATES_CACHE_KEY = "mansello_fx_rates";
const CHOICE_KEY = "mansello_display_currency";
const RATES_TTL_MS = 12 * 60 * 60 * 1000;

// Units of each currency per 1 USD.
type Rates = Record<DisplayCurrency, number>;

interface CurrencyState {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  /** Converted amount in the display currency, or null if no rate is available. */
  convert: (amount: number, from: string) => number | null;
}

const CurrencyContext = createContext<CurrencyState | null>(null);

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / storage full — conversion still works for this visit
  }
}

// Until the visitor picks one, show each site's own charge currency, so
// nothing is converted by default.
function defaultCurrencyFor(pathname: string): DisplayCurrency {
  return pathname.startsWith("/italy") ? "EUR" : "USD";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [chosen, setChosen] = useState<DisplayCurrency | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    const stored = readJson<DisplayCurrency>(CHOICE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored && DISPLAY_CURRENCIES.includes(stored)) setChosen(stored);

    const cached = readJson<{ rates: Rates; fetchedAt: number }>(RATES_CACHE_KEY);
    if (cached && Date.now() - cached.fetchedAt < RATES_TTL_MS) {
      setRates(cached.rates);
      return;
    }
    if (cached) setRates(cached.rates); // stale is better than nothing while refreshing

    const controller = new AbortController();
    fetch(RATES_URL, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { result?: string; rates?: Record<string, number> }) => {
        const r = body.rates;
        if (body.result !== "success" || !r?.EUR || !r?.LKR) return;
        const next: Rates = { USD: 1, EUR: r.EUR, LKR: r.LKR };
        setRates(next);
        writeJson(RATES_CACHE_KEY, { rates: next, fetchedAt: Date.now() });
      })
      .catch(() => {
        // offline / blocked — prices stay in their original currency
      });
    return () => controller.abort();
  }, []);

  const displayCurrency = chosen ?? defaultCurrencyFor(pathname);

  const value = useMemo<CurrencyState>(
    () => ({
      displayCurrency,
      setDisplayCurrency: (c) => {
        setChosen(c);
        writeJson(CHOICE_KEY, c);
      },
      convert: (amount, from) => {
        const src = from.toUpperCase() as DisplayCurrency;
        if (src === displayCurrency) return amount;
        if (!rates || !rates[src] || !rates[displayCurrency]) return null;
        return (amount / rates[src]) * rates[displayCurrency];
      },
    }),
    [displayCurrency, rates]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}

function formatDisplay(amount: number, currency: DisplayCurrency): string {
  // LKR amounts are large and nobody prices in cents — round to whole rupees.
  if (currency === "LKR") {
    return `LKR ${Math.round(amount).toLocaleString("en-US")}`;
  }
  return formatMoney(amount, currency);
}

/**
 * A price in the visitor's chosen display currency.
 *
 * - Default: the converted amount, prefixed "≈" when it was converted, with
 *   the real price in a tooltip. Use for browsing (cards, calendar, cart).
 * - `charged`: the real price first, then "(≈ converted)" — use wherever the
 *   number is what the card will actually be charged (payment, checkout
 *   totals, confirmations), so the charge currency is never in doubt.
 */
export function Money({
  amount,
  currency,
  charged = false,
}: {
  amount: string | number;
  currency: string;
  charged?: boolean;
}) {
  const { convert, displayCurrency } = useCurrency();
  const value = typeof amount === "string" ? Number(amount) : amount;
  const original = formatMoney(value, currency);
  const isSame = currency.toUpperCase() === displayCurrency;
  const converted = isSame ? null : convert(value, currency);

  if (converted == null) return <>{original}</>;
  const approx = `≈ ${formatDisplay(converted, displayCurrency)}`;
  if (charged) {
    return (
      <>
        {original} <span className="whitespace-nowrap text-[0.85em] font-normal opacity-70">({approx})</span>
      </>
    );
  }
  return (
    <span title={`Charged as ${original}`} className="whitespace-nowrap">
      {approx}
    </span>
  );
}

/** Shown near totals when the visitor is viewing a currency other than the charge currency. */
export function ConversionNotice({ currency, className = "" }: { currency: string; className?: string }) {
  const { displayCurrency, convert } = useCurrency();
  if (currency.toUpperCase() === displayCurrency || convert(1, currency) == null) return null;
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      Prices in {displayCurrency} are approximate and for reference only. You&apos;ll be charged in{" "}
      {currency.toUpperCase()}.
    </p>
  );
}

export function CurrencySwitcher({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "mobile") {
    return (
      <div className="flex items-center justify-between rounded-xl px-4 py-2">
        <span className="text-sm font-medium text-[#1F3D2E]/80">Currency</span>
        <div className="flex gap-1">
          {DISPLAY_CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDisplayCurrency(c)}
              aria-pressed={displayCurrency === c}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                displayCurrency === c ? "bg-[#1F3D2E] text-white" : "bg-[#F7F5F0] text-[#1F3D2E]/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Display currency: ${displayCurrency}`}
        className="flex items-center gap-1 text-sm font-medium text-[#1F3D2E]/80 transition hover:text-[#8DC63F]"
      >
        {displayCurrency}
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
          <ul role="listbox" aria-label="Display currency">
            {DISPLAY_CURRENCIES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  role="option"
                  aria-selected={displayCurrency === c}
                  onClick={() => {
                    setDisplayCurrency(c);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    displayCurrency === c ? "bg-[#F7F5F0] font-semibold text-[#1F3D2E]" : "text-[#1F3D2E]/80 hover:bg-[#F7F5F0]"
                  }`}
                >
                  <span>{c}</span>
                  <span className="text-xs text-slate-400">
                    {c === "USD" ? "US Dollar" : c === "EUR" ? "Euro" : "Sri Lankan Rupee"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-slate-100 px-3 pt-2 text-[11px] leading-snug text-slate-400">
            Approximate prices for reference — you&apos;re charged in the listed currency.{" "}
            <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">
              Rates by ExchangeRate-API
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
