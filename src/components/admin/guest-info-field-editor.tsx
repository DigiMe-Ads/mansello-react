"use client";

import { ADMIN_INPUT, ADMIN_SELECT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import type { GuestInfoField, GuestInfoFieldType } from "@/lib/api/types";

const TYPE_OPTIONS: { value: GuestInfoFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Yes / No" },
  { value: "file", label: "Document Upload" },
];

function newField(): GuestInfoField {
  return { id: crypto.randomUUID(), label: "", type: "text", required: false };
}

export function GuestInfoFieldEditor({
  fields,
  onChange,
}: {
  fields: GuestInfoField[];
  onChange: (fields: GuestInfoField[]) => void;
}) {
  function updateField(index: number, patch: Partial<GuestInfoField>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 && (
        <p className="text-sm text-slate-400">No fields yet — add the first one below.</p>
      )}

      {fields.map((field, i) => (
        <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <input
              type="text"
              placeholder="Question / field label"
              value={field.label}
              onChange={(e) => updateField(i, { label: e.target.value })}
              className={ADMIN_INPUT}
            />
            <select
              value={field.type}
              onChange={(e) => updateField(i, { type: e.target.value as GuestInfoFieldType })}
              className={ADMIN_SELECT}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {field.type === "select" && (
            <textarea
              placeholder="Options, one per line"
              rows={3}
              value={(field.options ?? []).join("\n")}
              onChange={(e) =>
                updateField(i, {
                  options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean),
                })
              }
              className={`${ADMIN_TEXTAREA} mt-3 w-full`}
            />
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(i, { required: e.target.checked })}
              />
              Required
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => moveField(i, -1)}
                disabled={i === 0}
                className="text-xs font-semibold text-slate-400 hover:text-[#153C4D] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => moveField(i, 1)}
                disabled={i === fields.length - 1}
                className="text-xs font-semibold text-slate-400 hover:text-[#153C4D] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => removeField(i)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...fields, newField()])}
        className="w-fit rounded-full border border-dashed border-slate-300 px-5 py-2 text-sm font-semibold text-slate-500 transition hover:border-[#153C4D] hover:text-[#153C4D]"
      >
        + Add Field
      </button>
    </div>
  );
}
