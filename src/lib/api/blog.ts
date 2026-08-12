import { apiFetch } from "./client";
import type { AuthedFetch } from "@/components/admin/admin-auth-provider";
import type { BlogPost, CreateBlogPostInput, Site, UpdateBlogPostInput } from "./types";

// Not in API_DOCUMENTATION.md yet — spec'd in BACKEND_CHANGES.md.

// Public: published posts only, for the given site.
export function getPosts(site: Site) {
  return apiFetch<BlogPost[]>(`/api/blog/posts?site=${encodeURIComponent(site)}`);
}

export function getPost(slug: string) {
  return apiFetch<BlogPost>(`/api/blog/posts/${slug}`);
}

// Admin: same path, but authenticated — spec calls for this to include
// drafts (publishedAt: null) too, and to allow omitting `site` to see both.
export function listPostsAdmin(fetcher: AuthedFetch, site?: Site) {
  const query = site ? `?site=${encodeURIComponent(site)}` : "";
  return fetcher<BlogPost[]>(`/api/blog/posts${query}`);
}

export function createPost(fetcher: AuthedFetch, input: CreateBlogPostInput) {
  return fetcher<BlogPost>("/api/blog/posts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePost(fetcher: AuthedFetch, id: string, input: UpdateBlogPostInput) {
  return fetcher<BlogPost>(`/api/blog/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePost(fetcher: AuthedFetch, id: string) {
  return fetcher<void>(`/api/blog/posts/${id}`, { method: "DELETE" });
}
