import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/ui/icon";
import { Reveal } from "@/components/motion/reveal";
import type { Service } from "@/types/content";

/**
 * Technology expertise grouped by service. Every row links to its service page with a
 * descriptive anchor. Content comes from the services data — nothing is invented here.
 */
export function TechExpertise({ services, limit = 7 }: { services: Service[]; limit?: number }) {
  const rows = services.filter((s) => s.technologies.length > 0);
  if (rows.length === 0) return null;
  return (
    <Reveal className="surface overflow-hidden">
      <dl className="divide-y divide-line">
        {rows.map((s) => (
          <div key={s.id} className="grid gap-3 px-5 py-5 sm:px-7 md:grid-cols-[minmax(0,17rem)_1fr] md:items-center md:gap-8">
            <dt className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-900 text-indigo-200">
                <ServiceIcon name={s.icon} className="size-4" />
              </span>
              <Link href={`/services/${s.slug}`} className="group inline-flex items-center gap-1.5 font-semibold leading-snug text-fg hover:text-indigo-200">
                {s.title}
                <ArrowRight className="size-3.5 shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-200" aria-hidden="true" />
              </Link>
            </dt>
            <dd>
              <ul className="flex flex-wrap gap-1.5" aria-label={`${s.title} technologies`}>
                {s.technologies.slice(0, limit).map((t) => (
                  <li key={t}>
                    <Badge mono>{t}</Badge>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}

/** Compact service cards with short descriptions — used where a page has no published items yet. */
export function CapabilityCards({ services }: { services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s, i) => (
        <Reveal as="li" key={s.id} delay={(i % 3) * 60}>
          <article className="surface surface-interactive group relative flex h-full flex-col p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent)] text-indigo-200">
                <ServiceIcon name={s.icon} className="size-5" />
              </span>
              <h3 className="text-base font-semibold leading-snug text-fg">
                <Link href={`/services/${s.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
                  {s.title}
                </Link>
              </h3>
            </div>
            <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-fg-3">{s.shortDescription}</p>
            {s.technologies.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                {s.technologies.slice(0, 4).map((t) => (
                  <li key={t}>
                    <Badge mono>{t}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </Reveal>
      ))}
    </ul>
  );
}
