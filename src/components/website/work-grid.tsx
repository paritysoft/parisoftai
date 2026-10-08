"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/website/project-card";
import { FilterGroup } from "@/components/website/filter-bar";
import { applyFilters, filterOptions, NO_FILTERS, type FilterState } from "@/lib/content/filters";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type Platform, type Project } from "@/types/content";

/** Portfolio grid. Filters appear only when there are enough projects for them to be useful. */
export function WorkGrid({ projects }: { projects: Project[] }) {
  const [f, setF] = useState<FilterState>(NO_FILTERS);
  const items = useMemo(() => projects.map((p) => ({ ...p, categories: [p.category] })), [projects]);
  const opts = useMemo(() => filterOptions(items), [items]);
  const filtered = applyFilters(items, f);
  const hasFilters = opts.platforms.length + opts.categories.length + opts.ownerships.length > 0;

  return (
    <div>
      {hasFilters ? (
        <div className="mb-10 flex flex-col gap-4">
          {opts.ownerships.length > 0 && (
            <FilterGroup
              label="Type"
              options={[{ value: "all", label: "All" }, { value: "company", label: "Our products" }, { value: "client", label: "Client projects" }]}
              value={f.ownership}
              onChange={(v) => setF((s) => ({ ...s, ownership: v as FilterState["ownership"] }))}
            />
          )}
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
            Showing {filtered.length} of {projects.length} projects
          </p>
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <div className="surface p-8 text-center text-fg-3">
          No projects match these filters.{" "}
          <button type="button" className="font-medium text-indigo-200 underline underline-offset-4" onClick={() => setF(NO_FILTERS)}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className={cn("grid gap-5", filtered.length > 1 ? "md:grid-cols-2" : "max-w-3xl")}>
          {filtered.map((p, i) => (
            <li key={p.id}>
              <ProjectCard project={p} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
