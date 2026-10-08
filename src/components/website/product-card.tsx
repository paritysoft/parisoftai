import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { PlatformBadges } from "@/components/website/platform-badges";
import { StoreLinks } from "@/components/website/store-links";
import type { Product } from "@/types/content";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="surface surface-interactive group relative flex h-full flex-col p-6">
      <div className="flex items-start gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-line bg-ink-900">
          {product.icon ? (
            <SmartImage src={product.icon} alt="" sizes="64px" />
          ) : (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] font-display text-2xl font-bold text-white">
              {product.name.slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug text-fg [overflow-wrap:anywhere]">
            <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
              {product.name}
            </Link>
          </h3>
          {product.categories.length > 0 ? <p className="mt-0.5 text-sm text-fg-3">{product.categories.join(" · ")}</p> : null}
        </div>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-[0.9375rem] leading-relaxed text-fg-2">{product.tagline}</p>
      <div className="mt-5">
        <PlatformBadges platforms={product.platforms} />
      </div>
      <StoreLinks product={product} className="mt-5" />
    </article>
  );
}
