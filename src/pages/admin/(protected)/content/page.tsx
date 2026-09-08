"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { getSiteContent, updateSiteContent } from "@/lib/api/content";
import { uploadImages } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/errors";
import {
  CONTENT_SECTIONS,
  CONTENT_DEFAULTS,
  CONTENT_FIELDS,
  type ContentField,
} from "@/lib/content/schema";
import { useSeo } from "@/lib/seo/use-seo";
import { PRIVATE_META } from "@/lib/seo/page-meta";

// Lets the client edit the site's marketing copy and imagery without a deploy.
// Every field falls back to the value hardcoded in the components (see
// src/lib/content/schema.ts), so an untouched install looks exactly as it did
// before — and "Restore defaults" writes those originals back.

type Scope = "global" | "italy" | "sri_lanka";

const SCOPE_LABELS: Record<Scope, string> = {
  global: "Shared",
  italy: "Italy",
  sri_lanka: "Sri Lanka",
};

export default function AdminContentPage() {
  useSeo(PRIVATE_META.admin("Content"));

  return (
    <RequireAdmin roles={["super_admin"]}>
      <ContentEditor />
    </RequireAdmin>
  );
}

function ContentEditor() {
  const { authedFetch } = useAdminAuth();

  const [values, setValues] = useState<Record<string, string>>(CONTENT_DEFAULTS);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [scope, setScope] = useState<Scope>("global");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSiteContent()
      .then((entries) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const e of entries) map[e.key] = e.value;
        setSaved(map);
        setValues({ ...CONTENT_DEFAULTS, ...map });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES_SITE_CONTENT.md is implemented. You can still edit below; saving will work once it ships."
            : null
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(() => CONTENT_SECTIONS.filter((s) => s.scope === scope), [scope]);

  // Only send what actually differs from what's stored, so an accidental save
  // doesn't rewrite the whole table.
  const changedKeys = useMemo(
    () => CONTENT_FIELDS.filter((f) => values[f.key] !== (saved[f.key] ?? f.default)).map((f) => f.key),
    [values, saved]
  );

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setNotice(null);
  }

  async function persist(entries: { key: string; value: string }[], message: string) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateSiteContent(authedFetch, entries);
      setSaved((prev) => {
        const next = { ...prev };
        for (const e of entries) next[e.key] = e.value;
        return next;
      });
      setNotice(message);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save content");
    } finally {
      setSaving(false);
    }
  }

  const handleSave = () =>
    persist(
      changedKeys.map((key) => ({ key, value: values[key] })),
      "Content saved."
    );

  /** Writes the built-in defaults back — the fallback content the site ships with. */
  function handleSeed() {
    const scoped = CONTENT_FIELDS.filter((f) => f.key.startsWith(scope === "global" ? "global." : `${scope}.`));
    setValues((prev) => {
      const next = { ...prev };
      for (const f of scoped) next[f.key] = f.default;
      return next;
    });
    void persist(
      scoped.map((f) => ({ key: f.key, value: f.default })),
      `Default ${SCOPE_LABELS[scope]} content restored.`
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#153C4D]">Site Content</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Edit the text and images shown on the public site. Anything left untouched uses the site&apos;s
          built-in default, so you can safely change one field at a time. Clearing a field also falls back to
          its default rather than showing a blank space.
        </p>
      </div>

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
      {notice && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
              scope === s
                ? "border-[#153C4D] text-[#153C4D]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {SCOPE_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          {sections.map((section) => (
            <section key={section.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#153C4D]">{section.title}</h2>
              {section.description && <p className="mt-1 text-xs text-slate-400">{section.description}</p>}

              <div className="mt-5 flex flex-col gap-5">
                {section.fields.map((field) => (
                  <Field
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ""}
                    isDefault={values[field.key] === field.default}
                    onChange={(v) => set(field.key, v)}
                    onReset={() => set(field.key, field.default)}
                  />
                ))}
              </div>
            </section>
          ))}

          <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-lg">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || changedKeys.length === 0}
              className="rounded-full bg-[#8DC63F] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleSeed}
              disabled={saving}
              className="rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Restore {SCOPE_LABELS[scope]} Defaults
            </button>

            <span className="text-xs text-slate-400">
              {changedKeys.length === 0
                ? "No unsaved changes."
                : `${changedKeys.length} unsaved change${changedKeys.length === 1 ? "" : "s"}.`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  field,
  value,
  isDefault,
  onChange,
  onReset,
}: {
  field: ContentField;
  value: string;
  isDefault: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const { authedFetch } = useAdminAuth();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={field.key} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {field.label}
        </label>
        {!isDefault && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:underline"
          >
            Reset to default
          </button>
        )}
      </div>
      {field.help && <p className="text-xs text-slate-400">{field.help}</p>}

      {field.type === "image" ? (
        <ImageDropzone
          images={value ? [value] : []}
          onChange={(images) => onChange(images[0] ?? "")}
          upload={async (files) => (await uploadImages(authedFetch, files)).urls}
          label=""
          multiple={false}
        />
      ) : field.type === "textarea" ? (
        <textarea
          id={field.key}
          rows={field.key.endsWith("highlights") ? 6 : 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={ADMIN_TEXTAREA}
        />
      ) : (
        <input
          id={field.key}
          type={field.type === "url" ? "url" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${ADMIN_INPUT} rounded-2xl`}
        />
      )}
    </div>
  );
}
