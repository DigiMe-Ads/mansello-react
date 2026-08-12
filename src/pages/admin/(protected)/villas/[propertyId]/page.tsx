"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "next/link";
import { RequireAdmin } from "@/components/admin/require-admin";
import { VillaBookingsTab } from "@/components/admin/villa/villa-bookings-tab";
import { VillaBlocksTab } from "@/components/admin/villa/villa-blocks-tab";
import { VillaPricingTab } from "@/components/admin/villa/villa-pricing-tab";
import { VillaOffersTab } from "@/components/admin/villa/villa-offers-tab";
import { VillaSettingsTab } from "@/components/admin/villa/villa-settings-tab";
import { getProperties } from "@/lib/api/properties";
import type { Property } from "@/lib/api/types";

const TABS = ["Bookings", "Calendar & Blocks", "Pricing", "Offers", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function VillaDetailPage() {
  const { propertyId = "" } = useParams<{ propertyId: string }>();

  return (
    <RequireAdmin roles={["super_admin", "villa_manager"]}>
      <VillaDetailContent propertyId={propertyId} />
    </RequireAdmin>
  );
}

function VillaDetailContent({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Bookings");

  const load = useCallback(() => {
    getProperties()
      .then((props) => {
        const match = props.find((p) => p.id === propertyId);
        if (!match) {
          setError("Property not found");
          return;
        }
        setProperty(match);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load property"));
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!property) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/villas" className="text-sm text-slate-400 hover:text-[#153C4D]">
          ← All Villas
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-[#153C4D]">{property.name}</h1>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "border-[#153C4D] text-[#153C4D]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Bookings" && (
        <VillaBookingsTab
          propertyId={property.id}
          currency={property.currency}
          cityTaxEnabled={property.cityTaxEnabled}
        />
      )}
      {tab === "Calendar & Blocks" && <VillaBlocksTab propertyId={property.id} />}
      {tab === "Pricing" && <VillaPricingTab key={property.updatedAt} property={property} onUpdated={load} />}
      {tab === "Offers" && <VillaOffersTab propertyId={property.id} />}
      {tab === "Settings" && <VillaSettingsTab property={property} onUpdated={load} />}
    </div>
  );
}
