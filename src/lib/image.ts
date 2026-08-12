// Product images are raw admin-entered URLs (no upload endpoint exists yet —
// see API_DOCUMENTATION.md §12), so a typo like "test" instead of a real URL
// is expected input, not a bug. next/image throws synchronously (crashing
// the whole page) if `src` isn't a leading-slash path or absolute URL, so
// every product image must be validated before being rendered.
export function isRenderableImageSrc(src: string | null | undefined): src is string {
  if (!src) return false;
  return src.startsWith("/") || /^https?:\/\//.test(src);
}


