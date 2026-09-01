// Pure-canvas click-heatmap renderer — no charting library, deliberately
// matching the look of tools like Plerdy/Hotjar: soft radial blobs colorized
// on a blue → cyan → green → yellow → orange → red scale, laid semi-
// transparently over a screenshot/iframe of the real page.
//
// Input points are already server-aggregated into grid cells (see
// BACKEND_CHANGES_HEATMAP_ANALYTICS.md) — `weight` is "how many clicks
// landed in this cell", not a raw click. So unlike heatmap.js's classic
// technique (stack many low-alpha blobs per raw point so overlaps
// accumulate), we draw each cell once with alpha already proportional to its
// weight, then colorize by that alpha. Simpler, and correct for
// pre-aggregated data.

export interface HeatPoint {
  xPct: number; // 0–1, fraction of the target width
  yPct: number; // 0–1, fraction of the target height
  weight: number;
}

// Single source of truth for the color scale — used both to build the
// canvas colorization lookup table and to render the on-screen legend, so
// the two can never drift apart.
export const HEAT_GRADIENT_STOPS: { stop: number; color: string }[] = [
  { stop: 0.0, color: "rgba(33,102,172,0)" }, // transparent at the very coldest edge
  { stop: 0.15, color: "rgb(33,102,172)" }, // blue
  { stop: 0.35, color: "rgb(103,169,207)" }, // cyan
  { stop: 0.55, color: "rgb(140,196,110)" }, // green
  { stop: 0.72, color: "rgb(250,222,88)" }, // yellow
  { stop: 0.87, color: "rgb(245,150,50)" }, // orange
  { stop: 1.0, color: "rgb(220,50,40)" }, // red — hottest
];

export const HEAT_LEGEND_CSS_GRADIENT = `linear-gradient(to right, ${HEAT_GRADIENT_STOPS.map(
  (s) => `${s.color} ${s.stop * 100}%`
).join(", ")})`;

let cachedLut: Uint8ClampedArray | null = null;

// A 256-entry RGBA lookup table: colorLut[i*4 .. i*4+3] is the RGBA color
// for grayscale-alpha level i.
function buildColorLut(): Uint8ClampedArray {
  if (cachedLut) return cachedLut;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const { stop, color } of HEAT_GRADIENT_STOPS) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  cachedLut = ctx.getImageData(0, 0, 256, 1).data;
  return cachedLut;
}

/**
 * Renders `points` as a Plerdy-style heat overlay onto `canvas`, sized to
 * `canvas`'s current CSS pixel dimensions. Call again whenever the points,
 * the container size, or the color scale changes — this always does a full
 * redraw, no incremental state.
 */
export function drawHeatmap(canvas: HTMLCanvasElement, points: HeatPoint[], maxWeight: number) {
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  if (cssWidth === 0 || cssHeight === 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x — this is a preview, not print
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (points.length === 0 || maxWeight <= 0) return;

  // Pass 1 — grayscale-alpha mask on an offscreen canvas at the same size.
  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;
  const mctx = mask.getContext("2d")!;

  // Blob radius scales with the render size so it looks consistent whether
  // we're drawing the mobile-width or desktop-width device frame.
  const radius = Math.max(18, Math.min(cssWidth, cssHeight) * 0.035) * dpr;

  for (const p of points) {
    const cx = p.xPct * canvas.width;
    const cy = p.yPct * canvas.height;
    const intensity = Math.min(1, p.weight / maxWeight);
    // A gamma curve (sqrt) so mid-traffic spots are still visibly warm
    // instead of everything below the hottest spot reading as "cold" —
    // matches how Plerdy's overlays stay readable even with one runaway hot
    // spot (e.g. a hero CTA button).
    const alpha = Math.pow(intensity, 0.55);

    const gradient = mctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    mctx.fillStyle = gradient;
    mctx.beginPath();
    mctx.arc(cx, cy, radius, 0, Math.PI * 2);
    mctx.fill();
  }

  // Pass 2 — colorize by alpha using the shared lookup table, then paint
  // onto the visible canvas.
  const lut = buildColorLut();
  const imageData = mctx.getImageData(0, 0, mask.width, mask.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]; // 0–255, from the grayscale blobs above
    if (a === 0) continue;
    const lutIndex = a * 4;
    data[i] = lut[lutIndex];
    data[i + 1] = lut[lutIndex + 1];
    data[i + 2] = lut[lutIndex + 2];
    // Keep some translucency even at the hottest point so the real page
    // underneath stays legible — a solid opaque blob is harder to read
    // against, and doesn't match Plerdy's look.
    data[i + 3] = Math.round(a * 0.85);
  }

  ctx.putImageData(imageData, 0, 0);
}
