import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { PlatformBadges, TechList } from "@/components/website/platform-badges";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/content";

export function ProjectCard({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <article className="surface surface-interactive group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-ink-900">
        {project.coverImage ? (
          <SmartImage
            src={project.coverImage}
            alt={`${project.title} preview`}
            priority={priority}
            className="transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--color-accent)_35%,transparent),transparent_60%),radial-gradient(circle_at_80%_90%,color-mix(in_oklab,var(--color-accent-2)_22%,transparent),transparent_55%)]">
            <span className="font-display text-6xl font-extrabold text-white/20">{project.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-3">
          <Badge tone={project.ownership === "company" ? "glow" : "neutral"}>{project.ownership === "company" ? "ParitySoft AI product" : "Client project"}</Badge>
          <span>{project.category}</span>
        </div>
        <h3 className="mt-3 text-xl font-semibold leading-snug text-fg [overflow-wrap:anywhere]">
          <Link href={`/work/${project.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2.5 line-clamp-3 flex-1 text-[0.9375rem] leading-relaxed text-fg-3">{project.summary}</p>
        <div className="mt-5 space-y-3">
          <PlatformBadges platforms={project.platforms} />
          <TechList items={project.technologies} limit={4} />
        </div>
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-200 group-hover:text-white" aria-hidden="true">
          View project details <ArrowUpRight className="size-4" />
        </span>
      </div>
    </article>
  );
}
