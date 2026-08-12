"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { GuestInfoFieldEditor } from "@/components/admin/guest-info-field-editor";
import { getGuestInfoFormTemplate, updateGuestInfoFormTemplate } from "@/lib/api/guest-info";
import { ApiRequestError } from "@/lib/api/errors";
import type { GuestInfoField } from "@/lib/api/types";

export default function GuestInfoFormSettingsPage() {
  return (
    <RequireAdmin roles={["super_admin"]}>
      <GuestInfoFormSettingsContent />
    </RequireAdmin>
  );
}

function GuestInfoFormSettingsContent() {
  const { authedFetch } = useAdminAuth();
  const [fields, setFields] = useState<GuestInfoField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getGuestInfoFormTemplate(authedFetch)
      .then((t) => setFields(t.fields))
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_GUEST_INFO_REQUESTS.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load the form template"
        )
      )
      .finally(() => setLoading(false));
  }, [authedFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateGuestInfoFormTemplate(authedFetch, { fields });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save the form template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#153C4D]">Guest Info Form</h1>
        <p className="mt-2 text-sm text-slate-500">
          These are the questions sent to a guest when you click &quot;Request Guest Info&quot; on one of their
          bookings. Changing this list only affects links sent from now on — a link that&apos;s already been
          emailed keeps showing the questions it was sent with.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <>
          <GuestInfoFieldEditor fields={fields} onChange={setFields} />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-fit rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {savedAt && (
              <span key={savedAt} className="text-xs font-semibold text-emerald-600">
                Saved
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
