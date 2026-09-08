"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { getPosts } from "@/lib/api/blog";
import { isRenderableImageSrc } from "@/lib/image";
import type { BlogPost } from "@/lib/api/types";

function DateBadge({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return (
    <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-[#1B4B4F] px-2.5 py-1.5 leading-none text-white">
      <span className="text-lg font-bold">{day}</span>
      <span className="text-[10px] font-medium">{month}</span>
    </div>
  );
}

export default function LatestNews() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPosts("italy")
      .then((result) => {
        if (!cancelled) setPosts(result);
      })
      .catch(() => {
        // No posts yet (or the endpoint isn't live until BACKEND_CHANGES.md
        // is implemented) — section just shows the empty state below.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [featured, ...rest] = posts;
  const miniPosts = rest.slice(0, 5);

  return (
    <section className="bg-[#DCEEEA] px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              <span className="text-[#1B4B4F]">Explore</span>{" "}
              <span className="text-[#F5A623]">Latest News</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              Tips, guides and stories from Bologna and beyond.
            </p>
          </div>

          <Link
            href="/italy/blog"
            className="shrink-0 rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-[#1F3D2E] shadow-md transition hover:bg-[#72A62E]"
          >
            See More Articles
          </Link>
        </div>

        {!loading && posts.length === 0 && (
          <p className="mt-10 text-sm text-slate-500">No articles published yet — check back soon.</p>
        )}

        {posts.length > 0 && (
          <div className={`mt-10 grid gap-6 ${miniPosts.length > 0 ? "lg:grid-cols-[1fr_400px]" : ""}`}>
            {/* Mini posts grid — omitted entirely when there's nothing to show yet,
                so the featured post doesn't end up next to a blank column */}
            {miniPosts.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {miniPosts.map((post) => (
                <Link key={post.id} href={`/italy/blog/${post.slug}`} className="flex items-stretch gap-3">
                  <div className="relative h-auto w-24 shrink-0 overflow-hidden rounded-2xl bg-[#B9DAD2]">
                    {post.coverImageUrl && isRenderableImageSrc(post.coverImageUrl) ? (
                      <Image src={post.coverImageUrl} alt={post.title} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-[#1B4B4F]/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-[#F5A623]">{post.author}</span>
                      <DateBadge dateStr={post.publishedAt ?? post.createdAt} />
                    </div>
                    <p className="mt-2 text-sm font-bold leading-snug text-[#1B4B4F]">{post.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            )}

            {/* Featured post */}
            {featured && (
              <Link
                href={`/italy/blog/${featured.slug}`}
                className="relative min-h-[420px] overflow-hidden rounded-3xl bg-[#B9DAD2]"
              >
                {featured.coverImageUrl && isRenderableImageSrc(featured.coverImageUrl) ? (
                  <Image
                    src={featured.coverImageUrl}
                    alt={featured.title}
                    fill
                    sizes="(min-width: 1024px) 400px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-[#1B4B4F]/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                <div className="absolute right-5 top-5">
                  <DateBadge dateStr={featured.publishedAt ?? featured.createdAt} />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="text-sm font-bold text-[#F5A623]">By {featured.author}</span>
                  <h3 className="mt-1 text-2xl font-bold leading-snug text-white">{featured.title}</h3>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
