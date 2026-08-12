"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { StatusBadge } from "@/components/admin/status-badge";
import { ADMIN_SELECT } from "@/components/admin/input-styles";
import { listOrders, updateOrderStatus } from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/currency";
import { formatDisplayDate } from "@/lib/date";
import type { Order, OrderStatus } from "@/lib/api/types";

const STATUS_OPTIONS = ["", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export default function AdminOrdersPage() {
  return (
    <RequireAdmin roles={["super_admin", "marketplace_manager"]}>
      <OrdersContent />
    </RequireAdmin>
  );
}

function OrdersContent() {
  const { authedFetch } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listOrders(authedFetch, statusFilter || undefined)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [authedFetch, statusFilter]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#153C4D]">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={ADMIN_SELECT}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  onChanged={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onChanged,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [nextStatus, setNextStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = VALID_TRANSITIONS[order.status] ?? [];

  async function handleUpdate() {
    if (!nextStatus) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateOrderStatus(authedFetch, order.id, nextStatus);
      setNextStatus("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to update order status");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <tr>
        <td className="border-t border-slate-100 px-4 py-3">
          <p className="font-semibold text-[#153C4D]">
            {order.customerName} {order.flaggedForReview && <span className="ml-1 text-xs text-red-600">⚑ flagged</span>}
          </p>
          <p className="text-xs text-slate-400">{order.customerPhone}</p>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
          {order.items.length} item{order.items.length > 1 ? "s" : ""}
        </td>
        <td className="border-t border-slate-100 px-4 py-3 font-semibold text-[#153C4D]">
          {formatMoney(order.total, "usd")}
        </td>
        <td className="border-t border-slate-100 px-4 py-3">
          <StatusBadge status={order.status} />
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
          {formatDisplayDate(order.createdAt.slice(0, 10))}
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-right">
          <button type="button" onClick={onToggle} className="text-xs font-semibold text-[#153C4D] hover:underline">
            {expanded ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <p>
                <span className="font-semibold">Delivery address:</span> {order.deliveryAddress}
              </p>
              {order.notes && (
                <p>
                  <span className="font-semibold">Notes:</span> {order.notes}
                </p>
              )}
              <div className="mt-2 flex flex-col gap-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.productNameSnapshot} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.lineTotal, "usd")}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span>Shipping</span>
                  <span>{formatMoney(order.shippingFee, "usd")}</span>
                </div>
              </div>
            </div>

            {options.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                {error && <p className="text-xs text-red-700">{error}</p>}
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className={ADMIN_SELECT}
                >
                  <option value="">Change status to...</option>
                  {options.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={!nextStatus || submitting}
                  className="rounded-full bg-[#153C4D] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
                >
                  {submitting ? "Updating..." : "Update"}
                </button>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
