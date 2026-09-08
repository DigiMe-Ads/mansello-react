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
import { VillaTransportTab } from "@/components/admin/villa/villa-transport-tab";
import { VillaSettingsTab } from "@/components/admin/villa/villa-settings-tab";
import { getProperties } from "@/lib/api/properties";
import { getRooms, usesRoomModel } from "@/lib/api/rooms";
import { ApiRequestError } from "@/lib/api/errors";
import type { Property, Room } from "@/lib/api/types";

type Tab =
  | "Bookings"
  | "Calendar & Blocks"
  | "Pricing"
  | "Seasonal Pricing"
  | "Rooms"
  | "Transport"
  | "Offers"
  | "Settings";

// "Pricing" (guests×rooms tiers) only makes sense for a property that
// doesn't use the room model; "Rooms" only makes sense for one that does —
// each property only ever uses one of those two pricing models, never both.
// "Seasonal Pricing" applies either way (it adapts internally to whichever
// model the property uses — see VillaRateOverridesTab).
function tabsFor(usesRoomModel: boolean): Tab[] {
  const base: Tab[] = ["Bookings", "Calendar & Blocks"];
  const pricing: Tab[] = usesRoomModel ? ["Seasonal Pricing", "Rooms"] : ["Pricing", "Seasonal Pricing"];
  return [...base, ...pricing, "Transport", "Offers", "Settings"];
}

export default function VillaDetailPage() {
  const { propertyId = "" } = useParams<{ propertyId: string }>();

  return (
    <RequireAdmin roles={["super_admin", "villa_manager"]}>
      {/* Keyed so switching between two different villas (same route
          pattern, different :propertyId) fully remounts this — resetting
          `tab`/`rooms`/`property` state instead of carrying over a
          selected tab (e.g. "Rooms") that may not apply to the new
          property. */}
      <VillaDetailContent key={propertyId} propertyId={propertyId} />
    </RequireAdmin>
  );
}

function VillaDetailContent({ propertyId }: { propertyId: string }) {
  const { authedFetch } = useAdminAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);
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
  // Whether this ends up non-empty is also what decides which pricing tab
  // (Pricing vs Rooms) applies to this property — see tabsFor above.
  const loadRooms = useCallback(() => {
    getRooms(authedFetch, propertyId)
      .then((result) => {
        setRooms(result);
        setRoomsLoaded(true);
      })
      .catch((err) => {
        // A property with no rooms configured (e.g. The Nest Bologna) 404s
        // here today until BACKEND_CHANGES_SRI_LANKA_ROOMS.md ships — that's
        // expected, just leave `rooms` empty rather than surfacing an error.
        setRoomsLoaded(true);
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

  const roomModel = property ? usesRoomModel(property, rooms) : false;
  const tabs = tabsFor(roomModel);

  // If rooms finish loading after the tab bar first renders and that
  // flips which pricing tab applies, fall back to Bookings rather than
  // leaving `tab` pointed at one that's no longer shown.
  useEffect(() => {
    if (roomsLoaded && !tabs.includes(tab)) setTab("Bookings");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomsLoaded, roomModel]);

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!property || !roomsLoaded) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/villas" className="text-sm text-slate-400 hover:text-[#153C4D]">
          ← All Villas
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-[#153C4D]">{property.name}</h1>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
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
      {tab === "Pricing" && !roomModel && (
        <VillaPricingTab key={property.updatedAt} property={property} onUpdated={load} />
      )}
      {tab === "Seasonal Pricing" && <VillaRateOverridesTab property={property} rooms={rooms} />}
      {tab === "Rooms" && roomModel && (
        <VillaRoomsTab propertyId={property.id} currency={property.currency} onChanged={loadRooms} />
      )}
      {tab === "Transport" && <VillaTransportTab property={property} />}
      {tab === "Offers" && <VillaOffersTab propertyId={property.id} />}
      {tab === "Settings" && <VillaSettingsTab property={property} onUpdated={load} />}
    </div>
  );
}
