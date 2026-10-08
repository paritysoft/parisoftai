import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Check } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { PlatformBadges } from "@/components/website/platform-badges";
import { StoreLinks } from "@/components/website/store-links";
import { Gallery } from "@/components/website/gallery";
import { ProductCard } from "@/components/website/product-card";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonClasses } from "@/components/ui/button";
import { CtaPanel } from "@/components/home/sections";
import { JsonLd } from "@/components/website/json-ld";
import { findRedirect, getProduct, listProducts } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";
import { productJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  return buildMetadata({
    path: `/products/${slug}`,
    title: product.seoTitle ?? `${product.name} — ${product.categories[0] ?? "App"} by ParitySoft AI`,
    description: product.seoDescription ?? product.tagline,
    image: product.ogImage ?? product.screenshots[0]?.url ?? product.icon,
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    const to = await findRedirect(`/products/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }
  const related = (await listProducts()).filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <>
      <PageHero crumbs={[{ label: "Products", href: "/products" }, { label: product.name, href: `/products/${product.slug}` }]} heading={product.name} intro={product.tagline}>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {product.icon ? (
            <div className="relative size-16 overflow-hidden rounded-2xl border border-line">
              <SmartImage src={product.icon} alt={`${product.name} icon`} sizes="64px" priority />
            </div>
          ) : null}
          <div className="space-y-2">
            {product.categories.length > 0 ? <p className="text-sm text-fg-3">{product.categories.join(" · ")}</p> : null}
            <PlatformBadges platforms={product.platforms} />
          </div>
        </div>
        <StoreLinks product={product} size="md" className="mt-8" />
      </PageHero>

      <div className="container-site space-y-16 pb-20 sm:space-y-20 sm:pb-24">
        {product.description || product.features.length > 0 ? (
          <div className={product.description && product.features.length > 0 ? "grid gap-12 lg:grid-cols-[1fr_340px]" : undefined}>
            {product.description ? (
              <section aria-label="About this product">
                <Markdown>{product.description}</Markdown>
                {product.publishedAt ? <p className="mt-8 text-sm text-fg-3">Published {formatDate(product.publishedAt)}</p> : null}
              </section>
            ) : null}
            {product.features.length > 0 && (
              <aside className="surface h-fit p-6" aria-labelledby="features">
                <h2 id="features" className="font-semibold text-fg">
                  Key features
                </h2>
                <ul className="mt-4 space-y-3">
                  {product.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[0.9375rem] text-fg-2">
                      <Check className="mt-1 size-4 shrink-0 text-glow" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        ) : null}

        {product.screenshots.length > 0 && (
          <section aria-labelledby="screens">
            <h2 id="screens" className="mb-8 text-2xl font-bold text-fg">
              Screenshots
            </h2>
            <Gallery images={product.screenshots} title={product.name} />
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related" className="text-2xl font-bold text-fg">
                More from ParitySoft AI
              </h2>
              <Link href="/products" className={buttonClasses("secondary", "sm")}>
                View all products
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <CtaPanel heading="Want an app like this?" description="We build iOS, Android, desktop and AI-powered software for businesses and product owners." primary={{ label: "Start a Project", href: "/contact" }} secondary={{ label: "Explore our services", href: "/services" }} />
      </div>
      <JsonLd data={productJsonLd(product)} />
    </>
  );
}
