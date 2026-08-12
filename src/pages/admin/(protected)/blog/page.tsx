"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/admin/require-admin";
import { useAdminAuth } from "@/components/admin/admin-auth-provider";
import { ADMIN_INPUT, ADMIN_SELECT, ADMIN_TEXTAREA } from "@/components/admin/input-styles";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { createPost, deletePost, listPostsAdmin, updatePost } from "@/lib/api/blog";
import { uploadImages } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/errors";
import { formatDisplayDate } from "@/lib/date";
import type { BlogPost, Site } from "@/lib/api/types";

const SITE_FILTERS: { label: string; value: Site | "" }[] = [
  { label: "All Sites", value: "" },
  { label: "Italy", value: "italy" },
  { label: "Sri Lanka", value: "sri_lanka" },
];

export default function AdminBlogPage() {
  return (
    <RequireAdmin roles={["super_admin"]}>
      <BlogContent />
    </RequireAdmin>
  );
}

function BlogContent() {
  const { authedFetch } = useAdminAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [siteFilter, setSiteFilter] = useState<Site | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listPostsAdmin(authedFetch, siteFilter || undefined)
      .then(setPosts)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Not available yet — the backend doesn't have this endpoint until BACKEND_CHANGES.md is implemented."
            : err instanceof Error
              ? err.message
              : "Failed to load posts"
        )
      )
      .finally(() => setLoading(false));
  }, [authedFetch, siteFilter]);

  useEffect(() => {
    // Standard fetch-on-mount/dependency-change: `load` itself synchronously
    // flips `loading`/`error` before its async call, which is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function togglePublished(post: BlogPost) {
    await updatePost(authedFetch, post.id, { publishedAt: post.publishedAt ? null : new Date().toISOString() });
    load();
  }

  async function remove(id: string) {
    await deletePost(authedFetch, id);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#153C4D]">Blog</h1>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-full bg-[#8DC63F] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
        >
          {showCreateForm ? "Cancel" : "+ New Post"}
        </button>
      </div>

      <div className="flex gap-2">
        {SITE_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setSiteFilter(f.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              siteFilter === f.value ? "bg-[#153C4D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showCreateForm && (
        <PostForm
          onDone={() => {
            setShowCreateForm(false);
            load();
          }}
        />
      )}

      {error && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading...</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="border-t border-slate-100 px-4 py-6 text-center text-slate-400">
                    No posts yet.
                  </td>
                </tr>
              )}
              {posts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  editing={editingId === post.id}
                  onToggleEdit={() => setEditingId(editingId === post.id ? null : post.id)}
                  onTogglePublished={() => togglePublished(post)}
                  onDelete={() => remove(post.id)}
                  onChanged={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PostRow({
  post,
  editing,
  onToggleEdit,
  onTogglePublished,
  onDelete,
  onChanged,
}: {
  post: BlogPost;
  editing: boolean;
  onToggleEdit: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  return (
    <>
      <tr>
        <td className="border-t border-slate-100 px-4 py-3">
          <p className="font-semibold text-[#153C4D]">{post.title}</p>
          <p className="text-xs text-slate-400">/{post.slug}</p>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 capitalize text-slate-600">
          {post.site.replace("_", " ")}
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{post.author}</td>
        <td className="border-t border-slate-100 px-4 py-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              post.publishedAt ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {post.publishedAt ? `Published ${formatDisplayDate(post.publishedAt.slice(0, 10))}` : "Draft"}
          </span>
        </td>
        <td className="border-t border-slate-100 px-4 py-3 text-right">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onTogglePublished} className="text-xs font-semibold text-[#153C4D] hover:underline">
              {post.publishedAt ? "Unpublish" : "Publish"}
            </button>
            <button type="button" onClick={onToggleEdit} className="text-xs font-semibold text-[#153C4D] hover:underline">
              Edit
            </button>
            <button type="button" onClick={onDelete} className="text-xs font-semibold text-red-600 hover:underline">
              Delete
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={5} className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
            <PostForm
              post={post}
              onDone={() => {
                onToggleEdit();
                onChanged();
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function PostForm({ post, onDone }: { post?: BlogPost; onDone: () => void }) {
  const { authedFetch } = useAdminAuth();
  const [site, setSite] = useState<Site>(post?.site ?? "italy");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [author, setAuthor] = useState(post?.author ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [coverImages, setCoverImages] = useState<string[]>(post?.coverImageUrl ? [post.coverImageUrl] : []);
  const [publishNow, setPublishNow] = useState(Boolean(post?.publishedAt));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (post) {
        await updatePost(authedFetch, post.id, {
          title,
          slug: slug || undefined,
          author,
          excerpt,
          body,
          coverImageUrl: coverImages[0],
          publishedAt: publishNow ? (post.publishedAt ?? new Date().toISOString()) : null,
        });
      } else {
        await createPost(authedFetch, {
          site,
          title,
          slug: slug || undefined,
          author,
          excerpt,
          body,
          coverImageUrl: coverImages[0],
          publishedAt: publishNow ? new Date().toISOString() : null,
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {!post && (
          <select value={site} onChange={(e) => setSite(e.target.value as Site)} className={ADMIN_SELECT}>
            <option value="italy">Italy</option>
            <option value="sri_lanka">Sri Lanka</option>
          </select>
        )}
        <input
          required
          placeholder="Slug (optional, derived from title)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={ADMIN_INPUT}
        />
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${ADMIN_INPUT} sm:col-span-2`}
        />
        <input
          required
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={ADMIN_INPUT}
        />
        <textarea
          required
          placeholder="Excerpt (shown in listings)"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={`${ADMIN_TEXTAREA} sm:col-span-2`}
        />
        <textarea
          required
          placeholder="Body"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${ADMIN_TEXTAREA} sm:col-span-2`}
        />
        <div className="sm:col-span-2">
          <ImageDropzone
            images={coverImages}
            onChange={setCoverImages}
            upload={(files) => uploadImages(authedFetch, files).then((r) => r.urls)}
            label="Cover image"
            multiple={false}
          />
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
        Published (visible on the site now — otherwise saved as a draft)
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-full bg-[#153C4D] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0e2c38] disabled:opacity-60"
      >
        {submitting ? "Saving..." : post ? "Save Changes" : "Create Post"}
      </button>
    </form>
  );
}
