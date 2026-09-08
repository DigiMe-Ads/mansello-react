"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHero from "@/components/italy/page-hero";
import Footer from "@/components/italy/footer";
import { getPost } from "@/lib/api/blog";
import { isRenderableImageSrc } from "@/lib/image";
import { formatDisplayDate } from "@/lib/date";
import type { BlogPost } from "@/lib/api/types";
import { useSeo } from "@/lib/seo/use-seo";
import { truncateForMeta } from "@/lib/seo/site";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/seo/structured-data";

export default function BlogPostContent({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPost(slug)
      .then(setPost)
      .catch((err) => setError(err instanceof Error ? err.message : "Article not found"));
  }, [slug]);

  // Metadata follows the fetched post; until it arrives this stays generic
  // rather than asserting a title the page isn't showing yet.
  useSeo(
    post
      ? {
          title: post.title,
          description: truncateForMeta(post.excerpt || post.body || post.title),
          path: `/italy/blog/${slug}`,
          image: post.coverImageUrl || undefined,
          type: "article",
          jsonLd: [
            blogPostingSchema({
              title: post.title,
              description: truncateForMeta(post.excerpt || post.body || post.title),
              path: `/italy/blog/${slug}`,
              image: post.coverImageUrl || undefined,
              publishedAt: post.publishedAt ?? post.createdAt,
              updatedAt: post.updatedAt ?? post.publishedAt ?? post.createdAt,
              author: post.author,
            }),
            breadcrumbSchema([
              { name: "Italy", path: "/italy" },
              { name: "Blog", path: "/italy/blog" },
              { name: post.title, path: `/italy/blog/${slug}` },
            ]),
          ],
        }
      : {
          title: "Blog",
          description: "Stories, tips, and local recommendations from Mansello.",
          path: `/italy/blog/${slug}`,
          noindex: !!error,
        }
  );

  return (
    <>
      <main>
        <PageHero
          title={post?.title ?? "Blog"}
          backgroundImage="/images/hero-bg.webp"
          backgroundAlt="Sunlight streaming through a cave"
          homeHref="/italy"
        />

        <section className="bg-white px-6 py-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!error && !post && <p className="text-sm text-slate-500">Loading...</p>}

            {post && (
              <article>
                {post.coverImageUrl && isRenderableImageSrc(post.coverImageUrl) && (
                  <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-3xl">
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {post.author} · {formatDisplayDate((post.publishedAt ?? post.createdAt).slice(0, 10))}
                </p>
                <h2 className="mt-2 text-3xl font-bold text-[#153C4D] sm:text-4xl">{post.title}</h2>
                <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{post.body}</div>
                <Link
                  href="/italy/blog"
                  className="mt-10 inline-block text-sm font-semibold text-[#153C4D] hover:underline"
                >
                  ← Back to Blog
                </Link>
              </article>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
