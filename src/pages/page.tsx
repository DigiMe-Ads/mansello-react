import Hero from "@/components/home/hero";
import { useSeo } from "@/lib/seo/use-seo";
import { PAGE_META } from "@/lib/seo/page-meta";
import { organizationSchema } from "@/lib/seo/structured-data";

export default function Home() {
  useSeo({ ...PAGE_META.home, jsonLd: organizationSchema() });

  return (
    <main>
      <Hero />
    </main>
  );
}