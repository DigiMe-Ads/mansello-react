"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHero from "@/components/page-hero";
import Footer from "@/components/sri-lanka/footer";
import { getPosts } from "@/lib/api/blog";
import { isRenderableImageSrc } from "@/lib/image";
import { formatDisplayDate } from "@/lib/date";
import type { BlogPost } from "@/lib/api/types";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPosts("sri_lanka")
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load articles"))
      .finally(() => setLoading(false));
  }, []);

  useSeo(PAGE_META.sriLankaBlog);

  return (
    <>
      <main>
        <PageHero title="Blog" backgroundImage="/images/hero-bg.webp" backgroundAlt="Sunlight streaming through a cave" homeHref="/sri-lanka" />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-6xl">
            {loading && <p className="text-sm text-slate-500">Loading articles...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && posts.length === 0 && (
              <p className="text-sm text-slate-500">No articles published yet — check back soon.</p>
            )}

            {posts.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/sri-lanka/blog/${post.slug}`}
                    className="overflow-hidden rounded-3xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[4/3] w-full bg-[#DCEEEA]">
                      {post.coverImageUrl && isRenderableImageSrc(post.coverImageUrl) && (
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {post.author} · {formatDisplayDate((post.publishedAt ?? post.createdAt).slice(0, 10))}
                      </p>
                      <h2 className="mt-2 text-lg font-bold text-[#153C4D]">{post.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-500">{post.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
