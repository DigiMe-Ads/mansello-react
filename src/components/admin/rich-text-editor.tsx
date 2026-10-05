"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, RemoveFormatting, Underline } from "lucide-react";
import { sanitizeRichText } from "@/lib/rich-text";

// Minimal WYSIWYG editor for product descriptions. Uses contentEditable +
// execCommand rather than pulling in an editor library: the feature set is
// deliberately small (bold / italic / underline / lists), and every value
// that leaves here is run through the same whitelist the storefront renders
// with (lib/rich-text.ts), so whatever the browser's editing quirks produce,
// only those tags are ever stored.

type Command = "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList";

const TOOLS: { command: Command; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { command: "bold", label: "Bold", icon: Bold },
  { command: "italic", label: "Italic", icon: Italic },
  { command: "underline", label: "Underline", icon: Underline },
  { command: "insertUnorderedList", label: "Bulleted list", icon: List },
  { command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
  ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  // Seed the editable area from `value`, and resync if the parent replaces
  // the value (e.g. a form reset) — but never while the admin is typing,
  // which would jump the caret to the start.
  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    const next = sanitizeRichText(value);
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  useEffect(() => {
    function refresh() {
      const el = editorRef.current;
      if (!el || !el.contains(document.getSelection()?.anchorNode ?? null)) return;
      setActive(Object.fromEntries(TOOLS.map((t) => [t.command, document.queryCommandState(t.command)])));
    }
    document.addEventListener("selectionchange", refresh);
    return () => document.removeEventListener("selectionchange", refresh);
  }, []);

  function emit() {
    const el = editorRef.current;
    if (el) onChange(sanitizeRichText(el.innerHTML));
  }

  function run(command: Command | "removeFormat") {
    editorRef.current?.focus();
    document.execCommand(command);
    emit();
  }

  // Pasting from Word / web pages brings fonts, colours and links along;
  // paste as plain text so the admin applies formatting with the toolbar.
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-[#153C4D]">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {TOOLS.map(({ command, label, icon: Icon }) => (
          <button
            key={command}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={Boolean(active[command])}
            // mousedown, not click: keeps the editor's selection intact.
            onMouseDown={(e) => {
              e.preventDefault();
              run(command);
            }}
            className={`grid h-8 w-8 place-items-center rounded-md transition ${
              active[command] ? "bg-[#153C4D] text-white" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <button
          type="button"
          title="Clear formatting"
          aria-label="Clear formatting"
          onMouseDown={(e) => {
            e.preventDefault();
            run("removeFormat");
          }}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-600 transition hover:bg-slate-200"
        >
          <RemoveFormatting size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        style={{ minHeight }}
        className="rich-text rich-text-editor max-h-[480px] overflow-y-auto px-4 py-3 text-sm text-slate-800 focus:outline-none"
      />
    </div>
  );
}
