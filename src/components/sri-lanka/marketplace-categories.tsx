import Image from "next/image";

const categories = [
  {
    image: "/images/sri-lanka/marketplace/italian-food.webp",
    title: "Italian Food & Pantry",
    description:
      "Pasta, olive oil, balsamic vinegar and specialities from Emilia-Romagna.",
  },
  {
    image: "/images/sri-lanka/marketplace/coffee-sweets.webp",
    title: "Coffee & Sweets",
    description: "Italian roasted coffee, chocolates and classic biscotti.",
  },
  {
    image: "/images/sri-lanka/marketplace/fashion-necessary.webp",
    title: "Fashion & Accessories",
    description: "Made-in-Italy leather goods and accessories.",
  },
  {
    image: "/images/sri-lanka/marketplace/home-lifestyle.webp",
    title: "Home & Lifestyle",
    description: "Italian design pieces to bring Bologna into your living room.",
  },
];

export default function MarketplaceCategories() {
  return (
    <section className="bg-white px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <div
            key={c.title}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <Image
              src={c.image}
              alt={c.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 top-[30%] flex flex-col justify-center rounded-tl-3xl bg-black/55 px-5 py-5 transition group-hover:bg-black/65">
              <h3 className="text-lg font-bold leading-tight text-white">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
