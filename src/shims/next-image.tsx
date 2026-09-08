import type { CSSProperties, ImgHTMLAttributes } from "react";

// Drop-in replacement for `next/image`. The original app only ever passed
// string `src` values (paths under /public or absolute Supabase URLs), plus
// the `fill`, `sizes`, `priority`, `width`, and `height` props. We render a
// plain <img> and reproduce the two layout modes Next provides:
//   - fill: absolutely fills the nearest positioned ancestor
//   - intrinsic: uses width/height like a normal image
// object-fit is driven by the caller's Tailwind classes (object-cover, etc.),
// exactly as before.

type NextImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  width?: number | string;
  height?: number | string;
};

export default function Image({
  src,
  alt,
  fill,
  priority,
  sizes,
  quality: _quality,
  width,
  height,
  className,
  style,
  loading,
  ...rest
}: NextImageProps) {
  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");
  // `loading="eager"` only opts out of lazy-loading — it does not lift the
  // image above the browser's default *low* priority for images. For a hero
  // that is the LCP element, that distinction is the whole point, so mirror
  // Next's behaviour and mark priority images as high-priority fetches too.
  const resolvedFetchPriority = priority ? "high" : undefined;

  if (fill) {
    const fillStyle: CSSProperties = {
      position: "absolute",
      inset: 0,
      height: "100%",
      width: "100%",
      ...style,
    };
    return (
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={resolvedLoading}
        fetchPriority={resolvedFetchPriority}
        decoding="async"
        className={className}
        style={fillStyle}
        {...rest}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={resolvedLoading}
      fetchPriority={resolvedFetchPriority}
      decoding="async"
      className={className}
      style={style}
      {...rest}
    />
  );
}
