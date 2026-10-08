import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonClasses } from "@/components/ui/button";
import { ServiceCard } from "@/components/website/service-card";
import { ProjectCard } from "@/components/website/project-card";
import { ProductCard } from "@/components/website/product-card";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { TechExpertise } from "@/components/website/capabilities";
import { cn } from "@/lib/utils";
import type { HomeSection, Product, Project, Service } from "@/types/content";

type SectionOf<K extends HomeSection["key"]> = Extract<HomeSection, { key: K }>;

const STAT_COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

export function StatsSection({ section }: { section: SectionOf<"stats"> }) {
  const stats = section.items.filter((s) => s.verified);
  if (stats.length === 0) return null;
  return (
    <section aria-labelledby="stats-heading" className="relative">
      <div className="container-site">
        <h2 id="stats-heading" className="sr-only">
          {section.heading}
        </h2>
        <Reveal className={cn("surface grid grid-cols-2 divide-line overflow-hidden lg:divide-x", STAT_COLS[Math.min(stats.length, 4)])}>
          {stats.map((s, i) => (
            <div
              key={`${s.label}-${i}`}
              className={cn(
                "flex flex-col gap-1 p-6 sm:p-8",
                i % 2 === 1 && "border-l border-line lg:border-l-0",
                i >= 2 && "border-t border-line lg:border-t-0",
              )}
            >
              <p className="font-display text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[0.9375rem] font-medium text-fg-2">{s.label}</p>
              {s.note ? <p className="text-xs text-fg-3">{s.note}</p> : null}
            </div>
          ))}
        </Reveal>
        {section.description ? <p className="mt-4 text-xs text-fg-3">{section.description}</p> : null}
      </div>
    </section>
  );
}

export function ServicesSection({ section, services }: { section: SectionOf<"services">; services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <section aria-labelledby="services-heading" className="section-y">
      <div className="container-site">
        <SectionHeader
          id="services-heading"
          heading={section.heading}
          description={section.description}
          action={
            <Link href="/services" className={buttonClasses("secondary", "md")}>
              All services <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 4) * 60}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Only published projects marked "Featured" appear on the homepage; no section otherwise. */
export function WorkSection({ section, projects }: { section: SectionOf<"work">; projects: Project[] }) {
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  if (featured.length === 0) return null;
  return (
    <section aria-labelledby="work-heading" className="section-y border-t border-line/60">
      <div className="container-site">
        <SectionHeader
          id="work-heading"
          heading={section.heading}
          description={section.description}
          action={
            <Link href="/work" className={buttonClasses("secondary", "md")}>
              View all projects <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <ul className={cn("mt-10 grid gap-5", featured.length > 1 && "md:grid-cols-2", featured.length === 1 && "max-w-3xl")}>
          {featured.map((p) => (
            <Reveal as="li" key={p.id}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Only published products marked "Featured" appear on the homepage; no section otherwise. */
export function ProductsSection({ section, products }: { section: SectionOf<"products">; products: Product[] }) {
  const shown = products.filter((p) => p.featured).slice(0, 6);
  if (shown.length === 0) return null;
  return (
    <section aria-labelledby="products-heading" className="section-y relative overflow-hidden border-t border-line/60 bg-ink-900/60">
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(180deg,#000,transparent_70%)]" />
      <div className="container-site relative">
        <SectionHeader
          id="products-heading"
          heading={section.heading}
          description={section.description}
          action={
            <Link href="/products" className={buttonClasses("secondary", "md")}>
              View all products <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <ul className={cn("mt-10 grid gap-4", shown.length > 1 && "sm:grid-cols-2", shown.length > 2 && "lg:grid-cols-3", shown.length === 1 && "max-w-xl")}>
          {shown.map((p) => (
            <Reveal as="li" key={p.id}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

const BENTO_SPANS = ["lg:col-span-2", "", "", "lg:col-span-2", "", "lg:col-span-2"];

export function WhySection({ section }: { section: SectionOf<"why"> }) {
  if (section.items.length === 0) return null;
  return (
    <section aria-labelledby="why-heading" className="section-y border-t border-line/60">
      <div className="container-site">
        <SectionHeader id="why-heading" heading={section.heading} description={section.description} />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, i) => {
            const wide = BENTO_SPANS[i % BENTO_SPANS.length] !== "";
            return (
              <Reveal as="li" key={`${item.title}-${i}`} className={cn(BENTO_SPANS[i % BENTO_SPANS.length], wide && "sm:col-span-2")}>
                <div
                  className={cn(
                    "surface relative h-full overflow-hidden p-7",
                    wide && "bg-[radial-gradient(120%_120%_at_100%_0%,color-mix(in_oklab,var(--color-accent)_16%,transparent),transparent_55%),linear-gradient(180deg,var(--color-ink-800),var(--color-ink-800))]",
                  )}
                >
                  <h3 className={cn("font-semibold text-fg", wide ? "text-2xl" : "text-lg")}>{item.title}</h3>
                  <p className={cn("mt-3 leading-relaxed text-fg-3", wide ? "max-w-lg text-base" : "text-[0.9375rem]")}>{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function TechSection({ section, services }: { section: SectionOf<"tech">; services: Service[] }) {
  if (!services.some((s) => s.technologies.length > 0)) return null;
  return (
    <section aria-labelledby="tech-heading" className="section-y border-t border-line/60">
      <div className="container-site">
        <SectionHeader id="tech-heading" heading={section.heading} description={section.description} />
        <div className="mt-10">
          <TechExpertise services={services} />
        </div>
      </div>
    </section>
  );
}

export function ProcessSection({ section }: { section: SectionOf<"process"> }) {
  if (section.items.length === 0) return null;
  return (
    <section aria-labelledby="process-heading" className="section-y border-t border-line/60">
      <div className="container-site">
        <SectionHeader id="process-heading" heading={section.heading} description={section.description} />
        <div className="mt-12">
          <ProcessTimeline steps={section.items} />
        </div>
      </div>
    </section>
  );
}

export function ProofSection({ section }: { section: SectionOf<"proof"> }) {
  const testimonials = section.testimonials.filter((t) => t.approved && t.quote && t.name);
  const useTestimonials = testimonials.length > 0;
  if (!useTestimonials && section.highlights.length === 0) return null;
  return (
    <section aria-labelledby="proof-heading" className="section-y border-t border-line/60">
      <div className="container-site">
        <SectionHeader id="proof-heading" heading={useTestimonials ? section.heading : section.fallbackHeading} description={section.description} />
        {useTestimonials ? (
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal as="li" key={`${t.name}-${i}`}>
                <figure className="surface flex h-full flex-col p-7">
                  <Quote className="size-6 text-accent" aria-hidden="true" />
                  <blockquote className="mt-4 flex-1 text-[1.0625rem] leading-relaxed text-fg">“{t.quote}”</blockquote>
                  <figcaption className="mt-6 text-sm">
                    <span className="font-semibold text-fg">{t.name}</span>
                    {t.role || t.company ? (
                      <span className="block text-fg-3">{[t.role, t.company].filter(Boolean).join(", ")}</span>
                    ) : null}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        ) : (
          <ul className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
            {section.highlights.map((h, i) => (
              <Reveal as="li" key={`${h.title}-${i}`} className="bg-ink-900 p-7">
                <h3 className="text-lg font-semibold text-fg">{h.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-fg-3">{h.description}</p>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function CtaSection({ section }: { section: SectionOf<"cta"> }) {
  return (
    <section aria-labelledby="cta-heading" className="section-y">
      <div className="container-site">
        <CtaPanel id="cta-heading" heading={section.heading} description={section.description} primary={section.primaryCta} secondary={section.secondaryCta} />
      </div>
    </section>
  );
}

export function CtaPanel({
  id,
  heading,
  description,
  primary,
  secondary,
}: {
  id?: string;
  heading: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <Reveal className="relative isolate overflow-hidden rounded-[28px] border border-white/10 px-6 py-16 text-center sm:px-12 sm:py-20">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-accent)_55%,var(--color-ink-950)),color-mix(in_oklab,var(--color-accent-2)_45%,var(--color-ink-950))_55%,var(--color-ink-900))]" />
      <div aria-hidden="true" className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-glow)_40%,transparent),transparent)] blur-xl motion-safe:animate-drift" />
      <div aria-hidden="true" className="dot-grid absolute inset-0 -z-10 opacity-25 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
      <h2 id={id} className="mx-auto max-w-2xl text-section text-white">
        {heading}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lead text-indigo-100/85">{description}</p>
      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={primary.href} className={buttonClasses("primary", "lg", "bg-white bg-none text-ink-950 shadow-none hover:bg-indigo-50")}>
          {primary.label} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        {secondary ? (
          <Link href={secondary.href} className={buttonClasses("secondary", "lg", "border-white/30 text-white hover:bg-white/10")}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}
