"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT } from "@/components/admin/input-styles";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { createRoom, deleteRoom, getRooms, updateRoom } from "@/lib/api/rooms";
import { uploadImages } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/errors";
import type { Room } from "@/lib/api/types";

// The public booking flow (BookingCalendarView) only shows a room picker at
// all once a property has rooms — properties that book as a single unit
// (The Nest Bologna) should simply never have any created here.
export function VillaRoomsTab({
  propertyId,
  currency,
  onChanged,
}: {
  propertyId: string;
  currency: string;
  // Lets the parent (which fetches this same property's rooms separately,
  // for the Bookings/Blocks tabs) refresh its own copy after a create/edit/
  // toggle/delete here, instead of only picking it up on next page load.
  onChanged?: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getRooms(authedFetch, propertyId)
      .then((result) => setRooms(result.sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_SRI_LANKA_ROOMS.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load rooms"
        )
      )
      .finally(() => setLoading(false));
  }, [authedFetch, propertyId]);

  useEffect(() => {
    // Standard fetch-on-mount: `load` itself synchronously flips
    // `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggleActive(room: Room) {
    await updateRoom(authedFetch, room.id, { active: !room.active });
    load();
    onChanged?.();
  }

  async function remove(id: string) {
    await deleteRoom(authedFetch, id);
    load();
    onChanged?.();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Properties with rooms here let guests pick specific rooms at checkout instead of just a
          room count — leave this empty for single-unit properties.
        </p>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setShowCreateForm((v) => !v);
          }}
          className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          {showCreateForm ? "Cancel" : "+ New Room"}
        </button>
      </div>

      {showCreateForm && (
        <RoomForm
          propertyId={propertyId}
          onSaved={() => {
            setShowCreateForm(false);
            load();
            onChanged?.();
          }}
        />
      )}

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {rooms.length === 0 && <p className="text-sm text-slate-400">No rooms yet.</p>}
          {rooms.map((room) =>
            editingId === room.id ? (
              <RoomForm
                key={room.id}
                propertyId={propertyId}
                room={room}
                onSaved={() => {
                  setEditingId(null);
                  load();
                  onChanged?.();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={room.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
                <div>
                  <p className="font-semibold text-[#153C4D]">
                    {room.name} — {room.subtitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    Sleeps {room.capacity} · {currency.toUpperCase()} {room.pricePerNight} / night
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-300">{room.id}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      room.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {room.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingId(room.id);
                    }}
                    className="text-xs font-semibold text-[#153C4D] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(room)}
                    className="text-xs font-semibold text-[#153C4D] hover:underline"
                  >
                    {room.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(room.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Shared create/edit form — pass `room` to prefill and PATCH it instead of
// creating a new one. Renaming/repricing an existing room is the only way
// to fix a typo'd name or a duplicate without deleting real booking history
// tied to its id (DELETE is rejected server-side once a booking references
// it — see BACKEND_CHANGES_SRI_LANKA_ROOMS.md).
function RoomForm({
  propertyId,
  room,
  onSaved,
  onCancel,
}: {
  propertyId: string;
  room?: Room;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const { authedFetch } = useAdminAuth();
  const [name, setName] = useState(room?.name ?? "");
  const [subtitle, setSubtitle] = useState(room?.subtitle ?? "");
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 2));
  const [pricePerNight, setPricePerNight] = useState(room?.pricePerNight ?? "");
  const [sortOrder, setSortOrder] = useState(String(room?.sortOrder ?? 0));
  const [images, setImages] = useState<string[]>(room?.images ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        name,
        subtitle: subtitle || undefined,
        capacity: Number(capacity),
        pricePerNight: Number(pricePerNight),
        images,
        sortOrder: Number(sortOrder) || 0,
      };
      if (room) {
        await updateRoom(authedFetch, room.id, input);
      } else {
        await createRoom(authedFetch, propertyId, input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : `Failed to ${room ? "save" : "create"} room`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Room Name
          <input
            required
            placeholder="e.g. Ella Room"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Subtitle
          <input
            placeholder="e.g. Double Room"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Capacity (guests)
          <input
            required
            type="number"
            min={1}
            placeholder="e.g. 4"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Price / Night
          <input
            required
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 45.00"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Display Order (0 = shown first)
          <input
            type="number"
            placeholder="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`${ADMIN_INPUT} font-normal normal-case`}
          />
        </label>
      </div>
      <div className="mt-3">
        <ImageDropzone
          images={images}
          onChange={setImages}
          upload={(files) => uploadImages(authedFetch, files).then((r) => r.urls)}
          label="Room photos"
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
        >
          {submitting ? "Saving..." : room ? "Save Changes" : "Create Room"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-slate-500 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
