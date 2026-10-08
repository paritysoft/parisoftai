"use client";

import { cn } from "@/lib/utils";

export function FilterGroup({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 w-full text-sm text-fg-3 sm:w-auto">{label}</span>
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
