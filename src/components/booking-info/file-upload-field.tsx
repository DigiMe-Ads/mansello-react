"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { uploadGuestInfoFiles } from "@/lib/api/guest-info";

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url;
  }
}

// Guest-facing equivalent of the admin ImageDropzone — uploads immediately
// on selection against the token-gated public endpoint (no guest account,
// the link's own token is the auth), and accepts photos or PDFs since a
// document could be either depending on how the guest scans it.
export function FileUploadField({
  token,
  value,
  onChange,
}: {
  token: string;
  value: string[] | undefined;
  onChange: (urls: string[]) => void;
}) {
  const files = value ?? [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(fileList: FileList | File[]) {
    const selected = Array.from(fileList);
    if (selected.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const { urls } = await uploadGuestInfoFiles(token, selected);
      onChange([...files, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload — please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  function removeFile(url: string) {
    onChange(files.filter((u) => u !== url));
  }

  return (
    <div>
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition ${
          dragActive ? "border-[#8DC63F] bg-[#8DC63F]/5" : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <UploadCloud size={22} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          {uploading ? "Uploading..." : "Drag & drop, or click to browse"}
        </p>
        <p className="text-xs text-slate-400">Photo or PDF</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((url) => (
            <div
              key={url}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                <FileText size={14} className="shrink-0 text-slate-400" />
                <span className="truncate">{fileNameFromUrl(url)}</span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(url)}
                aria-label="Remove file"
                className="shrink-0 text-slate-400 transition hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
