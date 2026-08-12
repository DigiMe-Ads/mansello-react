"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { getDashboard } from "@/lib/api/admin";
import { getProperties } from "@/lib/api/properties";
import { formatMoney } from "@/lib/currency";
import { formatDisplayDate } from "@/lib/date";
import type { DashboardData, Property } from "@/lib/api/types";

export default function AdminDashboardPage() {
  const { authedFetch } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboard(authedFetch), getProperties()])
      .then(([dashboard, props]) => {
        if (cancelled) return;
        setData(dashboard);
        setProperties(props);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function propertyName(id: string) {
    return properties.find((p) => p.id === id)?.name ?? id;
  }
  function propertyCurrency(id: string) {
    return properties.find((p) => p.id === id)?.currency ?? "usd";
  }

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading dashboard...</p>;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-[#153C4D]">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/marketplace/orders"
          className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">Pending Orders</p>
          <p className="mt-2 text-3xl font-bold text-[#153C4D]">{data.pendingOrdersCount}</p>
        </Link>
        <Link
          href="/admin/marketplace/products"
          className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">Low Stock Items</p>
          <p className="mt-2 text-3xl font-bold text-[#153C4D]">{data.lowStockCount}</p>
        </Link>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming Check-ins (7d)</p>
          <p className="mt-2 text-3xl font-bold text-[#153C4D]">{data.upcomingCheckIns.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming Check-outs (7d)</p>
          <p className="mt-2 text-3xl font-bold text-[#153C4D]">{data.upcomingCheckOuts.length}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Revenue by Property</h2>
        <div className="mt-4 flex flex-col gap-2">
          {data.revenueByProperty.length === 0 && <p className="text-sm text-slate-400">No revenue yet.</p>}
          {data.revenueByProperty.map((r) => (
            <div key={r.propertyId} className="flex justify-between text-sm text-slate-600">
              <span>{propertyName(r.propertyId)}</span>
              <span className="font-semibold text-[#153C4D]">
                {formatMoney(r._sum.totalPrice ?? "0", propertyCurrency(r.propertyId))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Upcoming Check-ins</h2>
          <div className="mt-4 flex flex-col gap-3">
            {data.upcomingCheckIns.length === 0 && <p className="text-sm text-slate-400">Nothing in the next 7 days.</p>}
            {data.upcomingCheckIns.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-[#153C4D]">{b.guestName}</p>
                  <p className="text-slate-400">{b.property.name}</p>
                </div>
                <p className="text-slate-600">{formatDisplayDate(b.checkIn.slice(0, 10))}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">Upcoming Check-outs</h2>
          <div className="mt-4 flex flex-col gap-3">
            {data.upcomingCheckOuts.length === 0 && <p className="text-sm text-slate-400">Nothing in the next 7 days.</p>}
            {data.upcomingCheckOuts.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-[#153C4D]">{b.guestName}</p>
                  <p className="text-slate-400">{b.property.name}</p>
                </div>
                <p className="text-slate-600">{formatDisplayDate(b.checkOut.slice(0, 10))}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
