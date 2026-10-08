import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ServiceIcon } from "@/components/ui/icon";
import type { Service } from "@/types/content";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="surface surface-interactive group flex h-full flex-col p-6">
      <div className="flex size-11 items-center justify-center rounded-xl border border-line bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent)] text-indigo-200 transition-colors group-hover:text-white">
        <ServiceIcon name={service.icon} className="size-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold leading-snug text-fg">
        <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none">
          {service.title}
        </Link>
      </h3>
      <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-fg-3">{service.shortDescription}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-200 transition-colors group-hover:text-white" aria-hidden="true">
        Learn more <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
