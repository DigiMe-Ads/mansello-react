import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { CreateTestimonialInput, Site, Testimonial, UpdateTestimonialInput } from "./types";

// Not in API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES_TESTIMONIALS.md.

// Public — active testimonials for one site, sorted by sortOrder. Used
// directly by components/italy/testimonials.tsx and
// components/sri-lanka/testimonials.tsx.
export function getTestimonials(site: Site) {
  return apiFetch<Testimonial[]>(`/api/testimonials?site=${site}`);
}

// Admin — same endpoint, but sent with an admin token so it includes
// inactive testimonials too, mirroring how GET /api/blog/posts already
// branches on admin auth to include drafts (see BACKEND_CHANGES_TESTIMONIALS.md).
// `site` is required here (confirmed against the live backend — unlike the
// original spec, it does not accept an admin request with no site at all),
// so an "all sites" view has to make two of these calls, one per site, and
// merge the results — see the admin Testimonials page.
export function listTestimonialsAdmin(fetcher: AuthedFetch, site: Site) {
  return fetcher<Testimonial[]>(`/api/testimonials?site=${site}`);
}

export function createTestimonial(fetcher: AuthedFetch, input: CreateTestimonialInput) {
  return fetcher<Testimonial>("/api/testimonials", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTestimonial(fetcher: AuthedFetch, id: string, input: UpdateTestimonialInput) {
  return fetcher<Testimonial>(`/api/testimonials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTestimonial(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/testimonials/${id}`, { method: "DELETE" });
}
