"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "next/link";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { VillaBookingsTab } from "@/components/admin/villa/villa-bookings-tab";
import { VillaBlocksTab } from "@/components/admin/villa/villa-blocks-tab";
import { VillaPricingTab } from "@/components/admin/villa/villa-pricing-tab";
import { VillaRateOverridesTab } from "@/components/admin/villa/villa-rate-overrides-tab";
import { VillaRoomsTab } from "@/components/admin/villa/villa-rooms-tab";
import { VillaOffersTab } from "@/components/admin/villa/villa-offers-tab";
import { VillaSettingsTab } from "@/components/admin/villa/villa-settings-tab";
import { getProperties } from "@/lib/api/properties";
import { getRooms } from "@/lib/api/rooms";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property, Room } from "@/lib/api/types";

const TABS = ["Bookings", "Calendar & Blocks", "Pricing", "Seasonal Pricing", "Rooms", "Offers", "Settings"] as const;
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
  const { authedFetch } = useAdminAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
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

  // Rooms are fetched from the dedicated `/rooms` endpoint (includes
  // inactive ones, needed so an old booking against a since-deactivated
  // room can still resolve its name) rather than trusted off `property`
  // above — `getProperties()` is the admin's property *list* endpoint,
  // which was never asked to embed `rooms` (only the public single-property
  // endpoint was). This is the shared list every tab that needs room names
  // (Bookings, Blocks) uses, so it only has to be correct in one place.
  const loadRooms = useCallback(() => {
    getRooms(authedFetch, propertyId)
      .then(setRooms)
      .catch((err) => {
        // A property with no rooms configured (e.g. The Nest Bologna) 404s
        // here today until BACKEND_CHANGES_SRI_LANKA_ROOMS.md ships — that's
        // expected, just leave `rooms` empty rather than surfacing an error.
        if (!(err instanceof ApiRequestError && err.status === 404)) {
          // eslint-disable-next-line no-console
          console.error("Failed to load rooms", err);
        }
      });
  }, [authedFetch, propertyId]);

  useEffect(() => {
    load();
    loadRooms();
  }, [load, loadRooms]);

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
          rooms={rooms}
        />
      )}
      {tab === "Calendar & Blocks" && <VillaBlocksTab propertyId={property.id} rooms={rooms} />}
      {tab === "Pricing" && <VillaPricingTab key={property.updatedAt} property={property} onUpdated={load} />}
      {tab === "Seasonal Pricing" && <VillaRateOverridesTab property={property} rooms={rooms} />}
      {tab === "Rooms" && (
        <VillaRoomsTab propertyId={property.id} currency={property.currency} onChanged={loadRooms} />
      )}
      {tab === "Offers" && <VillaOffersTab propertyId={property.id} />}
      {tab === "Settings" && <VillaSettingsTab property={property} onUpdated={load} />}
    </div>
  );
}
