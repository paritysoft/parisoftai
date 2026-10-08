import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { Faq } from "@/components/website/faq";
import { ProjectCard } from "@/components/website/project-card";
import { TechList } from "@/components/website/platform-badges";
import { CtaPanel } from "@/components/home/sections";
import { ServiceIcon } from "@/components/ui/icon";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/website/json-ld";
import { findRedirect, getService, getSiteSettings, listProjects, listServices } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return buildMetadata({
    path: `/services/${slug}`,
    title: service.seoTitle ?? service.title,
    description: service.seoDescription ?? service.shortDescription,
    image: service.coverImage,
  });
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) {
    const to = await findRedirect(`/services/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }

  const [projects, settings, all] = await Promise.all([listProjects(), getSiteSettings(), listServices()]);
  const techs = new Set(service.technologies.map((t) => t.toLowerCase()));
  const related = projects.filter((p) => p.technologies.some((t) => techs.has(t.toLowerCase()))).slice(0, 2);
  const others = all.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <PageHero crumbs={[{ label: "Services", href: "/services" }, { label: service.title, href: `/services/${service.slug}` }]} heading={service.title} intro={service.fullDescription}>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href={`/contact?service=${encodeURIComponent(service.title)}`} className={buttonClasses("primary", "lg")}>
            Discuss your project <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/work" className={buttonClasses("secondary", "lg")}>
            See our work
          </Link>
        </div>
      </PageHero>

      <div className="container-site space-y-24 pb-24">
        {service.problems.length > 0 && (
          <section aria-labelledby="problems" className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="problems" className="text-2xl font-bold text-fg sm:text-3xl">
                Problems we solve
              </h2>
              <p className="mt-3 text-fg-3">If any of these sound familiar, this service is a good fit.</p>
            </div>
            <ul className="space-y-3">
              {service.problems.map((p) => (
                <Reveal as="li" key={p} className="surface flex gap-4 p-5">
                  <Check className="mt-0.5 size-5 shrink-0 text-glow" aria-hidden="true" />
                  <span className="text-fg-2">{p}</span>
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        {service.features.length > 0 && (
          <section aria-labelledby="capabilities">
            <h2 id="capabilities" className="text-2xl font-bold text-fg sm:text-3xl">
              Capabilities
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {service.features.map((f, i) => (
                <Reveal as="li" key={f.title} delay={i * 60} className="surface p-6">
                  <ServiceIcon name={service.icon} className="size-5 text-indigo-200" />
                  <h3 className="mt-4 text-lg font-semibold text-fg">{f.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-3">{f.description}</p>
                </Reveal>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="stack" className="grid gap-10 lg:grid-cols-2">
          {service.technologies.length > 0 && (
            <div>
              <h2 id="stack" className="text-2xl font-bold text-fg sm:text-3xl">
                Technology stack
              </h2>
              <div className="mt-6">
                <TechList items={service.technologies} />
              </div>
            </div>
          )}
          {service.benefits.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-fg sm:text-3xl">What you get</h2>
              <ul className="mt-6 space-y-3">
                {service.benefits.map((b) => (
                  <li key={b} className="flex gap-3 text-fg-2">
                    <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {service.approach.length > 0 && (
          <section aria-labelledby="approach">
            <h2 id="approach" className="text-2xl font-bold text-fg sm:text-3xl">
              How we approach it
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {service.approach.map((step, i) => (
                <Reveal as="li" key={step.title} className="surface p-6">
                  <span className="font-mono text-sm text-glow" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-fg">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-3">{step.description}</p>
                </Reveal>
              ))}
            </ol>
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-work">
            <h2 id="related-work" className="text-2xl font-bold text-fg sm:text-3xl">
              Related work
            </h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {related.map((p) => (
                <li key={p.id}>
                  <ProjectCard project={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="FAQ">
          <Faq items={service.faq} />
        </section>

        <CtaPanel
          heading={`Have a ${service.title} project in mind?`}
          description="Tell us about your goals and timeline, and we'll reply with next steps."
          primary={{ label: "Start a Project", href: `/contact?service=${encodeURIComponent(service.title)}` }}
        />

        {others.length > 0 && (
          <nav aria-label="Other services">
            <h2 className="text-lg font-semibold text-fg">Other services</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {others.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className={buttonClasses("secondary", "sm")}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.shortDescription,
          url: absoluteUrl(`/services/${service.slug}`),
          provider: { "@type": "Organization", name: settings.general.companyName, url: absoluteUrl("/") },
        }}
      />
    </>
  );
}
