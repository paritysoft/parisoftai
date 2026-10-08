"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/website/product-card";
import { FilterGroup } from "@/components/website/filter-bar";
import { applyFilters, filterOptions, NO_FILTERS, type FilterState } from "@/lib/content/filters";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type Platform, type Product } from "@/types/content";

export function ProductGrid({ products }: { products: Product[] }) {
  const [f, setF] = useState<FilterState>(NO_FILTERS);
  const opts = useMemo(() => filterOptions(products), [products]);
  const filtered = applyFilters(products, f);
  const hasFilters = opts.platforms.length + opts.categories.length > 0;

  return (
    <div>
      {hasFilters ? (
        <div className="mb-10 flex flex-col gap-4">
          {opts.platforms.length > 0 && (
            <FilterGroup
              label="Platform"
              options={[{ value: "all", label: "All platforms" }, ...opts.platforms.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))]}
              value={f.platform}
              onChange={(v) => setF((s) => ({ ...s, platform: v as Platform | "all" }))}
            />
          )}
          {opts.categories.length > 0 && (
            <FilterGroup
              label="Category"
              options={[{ value: "all", label: "All categories" }, ...opts.categories.map((c) => ({ value: c, label: c }))]}
              value={f.category}
              onChange={(v) => setF((s) => ({ ...s, category: v }))}
            />
          )}
          <p className="sr-only" aria-live="polite">
            Showing {filtered.length} of {products.length} products
          </p>
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <div className="surface p-8 text-center text-fg-3">
          No products match these filters.{" "}
          <button type="button" className="font-medium text-indigo-200 underline underline-offset-4" onClick={() => setF(NO_FILTERS)}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className={cn("grid gap-4", filtered.length > 1 && "sm:grid-cols-2", filtered.length > 2 && "lg:grid-cols-3", filtered.length === 1 && "max-w-xl")}>
          {filtered.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
