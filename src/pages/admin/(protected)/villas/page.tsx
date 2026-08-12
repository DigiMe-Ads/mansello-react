"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { RequireAdmin } from "@/components/admin/require-admin";
import { getProperties } from "@/lib/api/properties";
import type { Property } from "@/lib/api/types";

export default function VillasPage() {
  return (
    <RequireAdmin roles={["super_admin", "villa_manager"]}>
      <VillasContent />
    </RequireAdmin>
  );
}

function VillasContent() {
  const { admin } = useAdminAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProperties()
      .then(setProperties)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load properties"))
      .finally(() => setLoading(false));
  }, []);

  const visible =
    admin?.role === "villa_manager" ? properties.filter((p) => p.id === admin.propertyScopeId) : properties;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#153C4D]">Villas</h1>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((property) => (
          <Link
            key={property.id}
            href={`/admin/villas/${property.id}`}
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-lg font-bold text-[#153C4D]">{property.name}</p>
            <p className="mt-1 text-sm text-slate-500">{property.address}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
              Min nights: {property.minNights} · Max guests: {property.maxGuests}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
