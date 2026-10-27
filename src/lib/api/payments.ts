import { apiFetch } from "./client";

// Optional payment methods (crypto via NOWPayments) — see
// components/payments/crypto-pay-option.tsx.

export function getPaymentMethods() {
  return apiFetch<{ crypto: boolean }>("/api/payments/methods");
}

/** Switches a pending booking to a crypto invoice; send the guest to checkoutUrl. */
export function startBookingCryptoCheckout(bookingId: string) {
  return apiFetch<{ checkoutUrl: string }>(`/api/bookings/${bookingId}/crypto-checkout`, { method: "POST" });
}

/** Switches a pending marketplace order to a crypto invoice; send the customer to checkoutUrl. */
export function startOrderCryptoCheckout(orderId: string) {
  return apiFetch<{ checkoutUrl: string }>(`/api/marketplace/orders/${orderId}/crypto-checkout`, { method: "POST" });
}
