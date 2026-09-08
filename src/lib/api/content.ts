import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";

// Editable site content — see src/lib/content/schema.ts for the field list and
// their hardcoded defaults, and BACKEND_CHANGES_SITE_CONTENT.md for the spec.
// Not in API_DOCUMENTATION.md yet, so every caller treats a 404 as "nothing
// saved" and falls back to the defaults rather than surfacing an error.

export interface ContentEntry {
  key: string;
  value: string;
}

/** Public: one flat key -> value map for the whole site. */
export function getSiteContent() {
  return apiFetch<ContentEntry[]>("/api/content");
}

/** Admin: upserts only the keys provided; omitted keys are left untouched. */
export function updateSiteContent(fetcher: AuthedFetch, entries: ContentEntry[]) {
  return fetcher<ContentEntry[]>("/api/admin/content", {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

/** Admin: deletes a key so the site falls back to its built-in default. */
export function resetSiteContentKeys(fetcher: AuthedFetch, keys: string[]) {
  return fetcher<void>("/api/admin/content", {
    method: "DELETE",
    body: JSON.stringify({ keys }),
  });
}
