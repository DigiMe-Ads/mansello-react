import { formatMoney } from "@/lib/currency";
import type { RefundStatus } from "@/lib/api/types";

// Payments.lk charge and refund state for a booking or order in the admin.
// Renders nothing for Stripe/older records, which have none of these fields.

interface PaymentFields {
  chargeAmount?: string | null;
  chargeCurrency?: string | null;
  refundStatus?: RefundStatus | null;
  refundError?: string | null;
  refundedChargeAmount?: string | null;
  paymentNote?: string | null;
}

const REFUND_STYLES: Record<RefundStatus, { label: string; className: string }> = {
  pending: { label: "Refund pending", className: "bg-amber-100 text-amber-700" },
  succeeded: { label: "Refunded", className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Refund failed", className: "bg-red-100 text-red-700" },
};

/** One-line summary under the price: "Charged LKR 9,010.40 · Refunded LKR 4,505.20". */
export function PaymentSummary({ record }: { record: PaymentFields }) {
  const currency = record.chargeCurrency ?? "lkr";
  const refunded = Number(record.refundedChargeAmount ?? 0);
  if (!record.chargeAmount && !record.refundStatus && refunded <= 0) return null;
  // The API sends amounts without forced trailing zeros ("9010.4");
  // formatMoney always shows two decimals.
  return (
    <span className="mt-0.5 block text-xs font-normal text-slate-500">
      {record.chargeAmount && <>Charged {formatMoney(record.chargeAmount, currency)}</>}
      {refunded > 0 && (
        <>
          {record.chargeAmount && " · "}
          Refunded {formatMoney(refunded, currency)}
        </>
      )}
      {record.refundStatus && (
        <span
          className={`ml-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${REFUND_STYLES[record.refundStatus].className}`}
        >
          {REFUND_STYLES[record.refundStatus].label}
        </span>
      )}
    </span>
  );
}

/** Admin-facing alerts: a failed refund's error and the backend's payment note. */
export function PaymentAlerts({ record }: { record: PaymentFields }) {
  const showError = record.refundStatus === "failed" && record.refundError;
  if (!showError && !record.paymentNote) return null;
  return (
    <div className="flex flex-col gap-1">
      {showError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="font-semibold">Refund failed:</span> {record.refundError} — the customer has not been
          refunded. Retry from the Payments.lk dashboard or contact Payments.lk.
        </p>
      )}
      {record.paymentNote && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-semibold">Payment note:</span> {record.paymentNote}
        </p>
      )}
    </div>
  );
}
