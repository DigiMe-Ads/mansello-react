import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { StripeAccountRef } from "./api/types";

const PUBLISHABLE_KEYS: Record<StripeAccountRef, string | undefined> = {
  italy: process.env.NEXT_PUBLIC_STRIPE_PK_ITALY,
  sri_lanka: process.env.NEXT_PUBLIC_STRIPE_PK_SRILANKA,
};

const stripePromiseCache = new Map<StripeAccountRef, Promise<Stripe | null>>();

export function getStripePromise(ref: StripeAccountRef): Promise<Stripe | null> {
  const cached = stripePromiseCache.get(ref);
  if (cached) return cached;

  const key = PUBLISHABLE_KEYS[ref];
  if (!key) throw new Error(`Missing Stripe publishable key for account "${ref}" — check .env.local`);

  const promise = loadStripe(key);
  stripePromiseCache.set(ref, promise);
  return promise;
}
