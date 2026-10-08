import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Check } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { PlatformBadges } from "@/components/website/platform-badges";
import { StoreLinks, storeLinksFor } from "@/components/website/store-links";
import { Gallery } from "@/components/website/gallery";
import { ProductCard } from "@/components/website/product-card";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";
import { JsonLd } from "@/components/website/json-ld";
import { findRedirect, getProduct, listProducts } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { PLATFORM_LABELS } from "@/types/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return buildMetadata({
    path: `/products/${slug}`,
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.tagline,
    image: product.screenshots[0]?.url ?? product.icon,
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
  const stores = storeLinksFor(product);

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
            <p className="text-sm text-fg-3">{product.category}</p>
            <PlatformBadges platforms={product.platforms} />
          </div>
        </div>
        <StoreLinks product={product} size="md" className="mt-8" />
      </PageHero>

      <div className="container-site space-y-20 pb-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div>{product.description ? <Markdown>{product.description}</Markdown> : null}</div>
          {product.features.length > 0 && (
            <aside className="surface h-fit p-6">
              <h2 className="font-semibold text-fg">Features</h2>
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

        {product.screenshots.length > 0 && (
          <section aria-labelledby="screens">
            <h2 id="screens" className="mb-8 text-2xl font-bold text-fg">Screenshots</h2>
            <Gallery images={product.screenshots} title={product.name} />
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related">
            <h2 id="related" className="text-2xl font-bold text-fg">More from ParitySoft AI</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: product.name,
          description: product.tagline,
          applicationCategory: product.category,
          operatingSystem: product.platforms.map((p) => PLATFORM_LABELS[p]).join(", "),
          url: absoluteUrl(`/products/${product.slug}`),
          ...(product.icon ? { image: product.icon } : {}),
          ...(stores.length ? { sameAs: stores.map((s) => s.url) } : {}),
        }}
      />
    </>
  );
}
