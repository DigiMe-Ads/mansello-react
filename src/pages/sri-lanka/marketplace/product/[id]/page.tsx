import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/sri-lanka/footer";
import { ProductDetails } from "@/components/marketplace/product-details";
import { getCategories, getProduct } from "@/lib/api/marketplace";
import { ApiRequestError } from "@/lib/api/errors";
import { categoryPath } from "@/lib/category-tree";
import { effectivePrice } from "@/lib/variants";
import { isRenderableImageSrc } from "@/lib/image";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";
import type { Category, Product } from "@/lib/api/types";

// One product on its own page (shareable link) — replaces the popup the
// marketplace cards used to open.

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function ProductPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setError(null);
    Promise.all([getProduct(id), getCategories()])
      .then(([p, cats]) => {
        if (cancelled) return;
        setProduct(p);
        setCategories(cats);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "This product isn't available any more."
            : "Couldn't load this product — please try again."
        );
      });
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [id]);

  const image = product?.images.find((src) => isRenderableImageSrc(src));
  useSeo(
    product
      ? {
          title: product.name,
          description: plainText(product.description).slice(0, 160) || PAGE_META.marketplace.description,
          path: `/sri-lanka/marketplace/product/${product.id}`,
          image,
          type: "product",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.images.filter((src) => isRenderableImageSrc(src)),
            description: plainText(product.description).slice(0, 500),
            sku: product.sku,
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: effectivePrice(product).toFixed(2),
              availability: "https://schema.org/InStock",
            },
          },
        }
      : { ...PAGE_META.marketplace, path: `/sri-lanka/marketplace/product/${id}` }
  );

  const category = product ? (categories.find((c) => c.id === product.categoryId) ?? product.category) : null;

  return (
    <>
      <Navbar />
      {/* Top padding clears the fixed navbar and the logo badge hanging below it. */}
      <main className="bg-white px-6 pb-20 pt-40 sm:px-12 sm:pt-56 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link href="/sri-lanka/marketplace" className="inline-flex items-center gap-1 font-semibold text-[#153C4D] hover:underline">
              <ChevronLeft size={16} /> Marketplace
            </Link>
            {category && (
              <>
                <span className="text-slate-300">/</span>
                <span>{categoryPath(category, categories)}</span>
              </>
            )}
          </nav>

          {error && (
            <div className="rounded-2xl bg-slate-50 p-10 text-center">
              <p className="text-slate-600">{error}</p>
              <Link
                href="/sri-lanka/marketplace"
                className="mt-4 inline-block rounded-full bg-[#8DC63F] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#72A62E]"
              >
                Browse the Marketplace
              </Link>
            </div>
          )}

          {!error && !product && (
            <div className="grid animate-pulse gap-8 md:grid-cols-2">
              <div className="aspect-square rounded-2xl bg-slate-100" />
              <div className="flex flex-col gap-3">
                <div className="h-4 w-1/3 rounded bg-slate-100" />
                <div className="h-8 w-3/4 rounded bg-slate-100" />
                <div className="h-6 w-1/4 rounded bg-slate-100" />
              </div>
            </div>
          )}

          {product && (
            <ProductDetails
              key={product.id}
              product={product}
              categories={categories}
              onReviewAdded={(rating) =>
                setProduct((p) => {
                  if (!p) return p;
                  const count = p.reviewCount ?? 0;
                  return { ...p, reviewCount: count + 1, averageRating: ((p.averageRating ?? 0) * count + rating) / (count + 1) };
                })
              }
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
