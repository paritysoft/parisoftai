import { ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { safeHref, cn } from "@/lib/utils";
import type { Product } from "@/types/content";

export function storeLinksFor(product: Product) {
  return [
    { label: "App Store", url: product.appStoreUrl },
    { label: "Google Play", url: product.googlePlayUrl },
    { label: "Microsoft Store", url: product.microsoftStoreUrl },
    { label: "Website", url: product.websiteUrl },
  ]
    .map((l) => ({ ...l, url: safeHref(l.url) }))
    .filter((l): l is { label: string; url: string } => Boolean(l.url && l.url.startsWith("https://")));
}

export function StoreLinks({ product, size = "sm", className }: { product: Product; size?: "sm" | "md"; className?: string }) {
  const links = storeLinksFor(product);
  if (links.length === 0) return null;
  return (
    <ul className={cn("relative z-10 flex flex-wrap gap-2", className)}>
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("secondary", size)}
            aria-label={`${product.name} on ${l.label} (opens in a new tab)`}
          >
            {l.label} <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
