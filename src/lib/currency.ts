const SYMBOL_FALLBACK: Record<string, string> = { eur: "€", usd: "$" };

export function formatMoney(amount: string | number, currency: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(value);
  } catch {
    return `${SYMBOL_FALLBACK[currency.toLowerCase()] ?? `${currency.toUpperCase()} `}${value.toFixed(2)}`;
  }
}
