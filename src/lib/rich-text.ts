// Product descriptions are stored as a small, whitelisted subset of HTML
// (bold / italic / underline / lists / line breaks) produced by the admin's
// RichTextEditor. Everything that renders one goes through
// `sanitizeRichText` first — the backend is asked to sanitize too (see
// BACKEND_CHANGES_PRODUCT_DETAILS_SUBCATEGORIES_ICAL.md), but the storefront never
// trusts stored HTML on its own.
//
// Descriptions saved before this existed are plain text; `isRichText`
// tells them apart so their line breaks still render.

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "BR", "P", "DIV", "UL", "OL", "LI"]);

// Editors emit these for the same formatting; normalise so stored markup
// stays small and predictable.
const TAG_ALIASES: Record<string, string> = { STRONG: "b", EM: "i" };

const HTML_TAG = /<\/?(b|strong|i|em|u|br|p|div|ul|ol|li)\b[^>]*>/i;

export function isRichText(value: string): boolean {
  return HTML_TAG.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanNode(node: Node, doc: Document): Node[] {
  if (node.nodeType === Node.TEXT_NODE) return [doc.createTextNode(node.textContent ?? "")];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];

  const el = node as Element;
  const children = Array.from(el.childNodes).flatMap((child) => cleanNode(child, doc));

  // Disallowed elements are unwrapped (their text kept), except ones whose
  // content is never meant to be shown.
  if (!ALLOWED_TAGS.has(el.tagName)) {
    return ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "TEMPLATE"].includes(el.tagName) ? [] : children;
  }

  // Attributes are dropped wholesale — no style, class, href or on* handler
  // survives.
  const clean = doc.createElement(TAG_ALIASES[el.tagName] ?? el.tagName.toLowerCase());
  for (const child of children) clean.appendChild(child);
  return [clean];
}

/** Returns safe HTML for any stored description, rich or plain. */
export function sanitizeRichText(value: string | null | undefined): string {
  if (!value) return "";
  if (!isRichText(value)) return escapeHtml(value).replace(/\r?\n/g, "<br>");
  if (typeof DOMParser === "undefined") return escapeHtml(value.replace(/<[^>]*>/g, ""));

  const doc = new DOMParser().parseFromString(`<body>${value}</body>`, "text/html");
  const out = doc.createElement("div");
  for (const child of Array.from(doc.body.childNodes).flatMap((n) => cleanNode(n, doc))) out.appendChild(child);
  return out.innerHTML;
}

/** Plain-text version for places that can't show formatting (cards, meta). */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value) return "";
  if (!isRichText(value)) return value;
  return value
    .replace(/<(br|\/p|\/div|\/li)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the editor holds nothing but empty markup (e.g. "<br>"). */
export function isRichTextEmpty(value: string): boolean {
  return richTextToPlain(value).length === 0;
}
