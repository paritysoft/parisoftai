"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/website/project-card";
import { cn } from "@/lib/utils";
import { PLATFORM_LABELS, type Platform, type Project } from "@/types/content";

/** Portfolio grid with platform/category filters. Only filters that match published projects are shown. */
export function WorkGrid({ projects }: { projects: Project[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [category, setCategory] = useState<string>("all");

  const platforms = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.platforms))), [projects]);
  const categories = useMemo(() => Array.from(new Set(projects.map((p) => p.category))).sort(), [projects]);

  const filtered = projects.filter(
    (p) => (platform === "all" || p.platforms.includes(platform)) && (category === "all" || p.category === category),
  );

  return (
    <div>
      <div className="flex flex-col gap-4">
        {platforms.length > 1 && (
          <FilterGroup
            label="Platform"
            options={[{ value: "all", label: "All platforms" }, ...platforms.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))]}
            value={platform}
            onChange={(v) => setPlatform(v as Platform | "all")}
          />
        )}
        {categories.length > 1 && (
          <FilterGroup
            label="Category"
            options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))]}
            value={category}
            onChange={setCategory}
          />
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {filtered.length} of {projects.length} projects
      </p>
      {filtered.length === 0 ? (
        <div className="surface mt-10 p-10 text-center text-fg-3">
          No projects match these filters.{" "}
          <button type="button" className="font-medium text-indigo-200 underline underline-offset-4" onClick={() => { setPlatform("all"); setCategory("all"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
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

function FilterGroup({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-fg-3">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-11 rounded-full border px-4 text-sm transition-colors sm:min-h-9",
            value === o.value ? "border-accent bg-accent/15 text-fg" : "border-line text-fg-3 hover:border-line-strong hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
