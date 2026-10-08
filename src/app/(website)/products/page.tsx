import type { Metadata } from "next";
import { Package } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { ProductCard } from "@/components/website/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { listProducts } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/products",
    title: "Our Products",
    description: "Software products designed, built and maintained by ParitySoft AI for iOS, Android, macOS, Windows and the web.",
  });
}

export default async function ProductsPage() {
  const products = await listProducts();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Products", href: "/products" }]}
        heading="Our own software products"
        intro="Beyond client development, we build and maintain our own digital products. Each one is available through its official store or website."
      />
      <section aria-label="Products" className="container-site pb-24">
        {products.length === 0 ? (
          <EmptyState
            icon={<Package className="size-8" aria-hidden="true" />}
            title="Product listings are coming soon"
            description="We're preparing pages for our published apps. Check back shortly."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Reveal as="li" key={p.id}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
