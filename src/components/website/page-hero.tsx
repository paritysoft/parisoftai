import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";

export function PageHero({ heading, intro, crumbs, children }: { heading: string; intro?: string; crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden pb-14 pt-32 sm:pt-36 lg:pb-20 lg:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="dot-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_60%_80%_at_20%_0%,#000,transparent_70%)]" />
        <div className="absolute -left-[10%] -top-[30%] h-[60vh] w-[55vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_26%,transparent),transparent)] blur-2xl" />
      </div>
      <div className="container-site">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-6 max-w-4xl text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-fg">{heading}</h1>
        {intro ? <p className="mt-6 max-w-2xl text-lead text-fg-2">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}
