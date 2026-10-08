import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { HeroVisual } from "@/components/home/hero-visual";
import type { CSSProperties } from "react";
import type { HomeContent } from "@/types/content";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

/**
 * Server-rendered hero. The headline and description paint immediately (LCP); supporting
 * elements use a short CSS entrance, so nothing depends on JavaScript to become visible.
 * Reduced motion disables all of it via the global media query in globals.css.
 */
export function Hero({ hero }: { hero: HomeContent["hero"] }) {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28 lg:pt-44">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {hero.backgroundImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- optional admin-provided background
          <img src={hero.backgroundImage} alt="" className="absolute inset-0 size-full object-cover opacity-25" />
        ) : null}
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_60%_40%,#000_20%,transparent_75%)] opacity-60" />
        <div className="absolute -left-[10%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_32%,transparent),transparent)] blur-2xl motion-safe:animate-drift" />
        <div className="absolute right-[-15%] top-[10%] h-[60vh] w-[50vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent-2)_26%,transparent),transparent)] blur-2xl motion-safe:animate-drift [animation-delay:-8s]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-950" />
      </div>

      <div className="container-site grid items-center gap-14 lg:grid-cols-[55fr_45fr] lg:gap-10">
        <div className="max-w-2xl">
          <p className="rise-in inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] py-1.5 pl-3 pr-3.5 text-[0.8125rem] font-medium text-fg-2">
            <span className="size-1.5 rounded-full bg-glow shadow-[0_0_10px_var(--color-glow)]" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-heading" className="mt-6 text-hero font-extrabold text-fg">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lead text-fg-2">{hero.description}</p>
          <div className="rise-in mt-9 flex flex-col gap-3 sm:flex-row" style={delay(120)}>
            <Link href={hero.primaryCta.href} className={buttonClasses("primary", "lg")}>
              {hero.primaryCta.label} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={hero.secondaryCta.href} className={buttonClasses("secondary", "lg")}>
              {hero.secondaryCta.label}
            </Link>
          </div>
          {hero.credibility ? (
            <p className="rise-in mt-8 flex items-start gap-2.5 text-sm text-fg-3" style={delay(220)}>
              <span className="mt-2 h-px w-6 shrink-0 bg-fg-3/60" aria-hidden="true" />
              {hero.credibility}
            </p>
          ) : null}
        </div>

        <div className="rise-in" style={delay(160)}>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
