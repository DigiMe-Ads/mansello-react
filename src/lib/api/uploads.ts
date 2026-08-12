import type { AuthedFetch } from "@/components/admin/admin-auth-provider";

// Not in API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES.md as a
// generalization of the existing product-image upload endpoint, reused here
// for offers and blog cover images instead of two more near-duplicate
// routes. Any admin role may call it (same as product image upload).
export function uploadImages(fetcher: AuthedFetch, files: File[]) {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);
  return fetcher<{ urls: string[] }>("/api/uploads/images", {
    method: "POST",
    body: formData,
  });
}
