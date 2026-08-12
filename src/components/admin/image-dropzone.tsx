"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X } from "lucide-react";
import { isRenderableImageSrc } from "@/lib/image";

// Generic drag-and-drop image uploader shared by anything that needs to
// attach images via the S3-backed upload endpoints (products, offers, blog
// cover images) — the actual upload call is injected via `upload` so this
// component has no knowledge of which endpoint it's hitting.
export function ImageDropzone({
  images,
  onChange,
  upload,
  label = "Images",
  multiple = true,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  upload: (files: File[]) => Promise<string[]>;
  label?: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await upload(files);
      onChange(multiple ? [...images, ...urls] : urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  function removeImage(url: string) {
    onChange(images.filter((u) => u !== url));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragActive ? "border-[#8DC63F] bg-[#8DC63F]/5" : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <UploadCloud size={26} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          {uploading ? "Uploading..." : `Drag & drop ${multiple ? "images" : "an image"} here, or click to browse`}
        </p>
        <p className="text-xs text-slate-400">JPEG, PNG or WebP</p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              {isRenderableImageSrc(url) ? (
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                  invalid
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
