import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { PlatformBadges, TechList } from "@/components/website/platform-badges";
import { Gallery } from "@/components/website/gallery";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonClasses } from "@/components/ui/button";
import { CtaPanel } from "@/components/home/sections";
import { JsonLd } from "@/components/website/json-ld";
import { findRedirect, getProject, listProjects } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { safeHref } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return buildMetadata({
    path: `/work/${slug}`,
    title: project.seoTitle ?? project.title,
    description: project.seoDescription ?? project.summary,
    image: project.coverImage,
    type: "article",
  });
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) {
    const to = await findRedirect(`/work/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }
  const links = project.externalLinks
    .map((l) => ({ ...l, url: safeHref(l.url) }))
    .filter((l): l is { label: string; url: string } => Boolean(l.url && l.label));

  return (
    <>
      <PageHero crumbs={[{ label: "Our Work", href: "/work" }, { label: project.title, href: `/work/${project.slug}` }]} heading={project.title} intro={project.summary}>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-fg-3">
          <span>{project.category}</span>
          <span>{project.ownership === "company" ? "ParitySoft AI product" : "Client project"}</span>
          <PlatformBadges platforms={project.platforms} />
        </div>
        {project.attribution ? <p className="mt-4 text-sm text-fg-3">{project.attribution}</p> : null}
      </PageHero>

      <div className="container-site space-y-20 pb-24">
        {project.coverImage ? (
          <div className="surface relative aspect-[16/9] overflow-hidden">
            <SmartImage src={project.coverImage} alt={`${project.title} cover`} priority sizes="(min-width: 1280px) 1216px, 100vw" />
          </div>
        ) : null}

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-12">
            {project.challenge ? (
              <section aria-labelledby="challenge">
                <h2 id="challenge" className="text-2xl font-bold text-fg">The challenge</h2>
                <Markdown className="mt-4">{project.challenge}</Markdown>
              </section>
            ) : null}
            {project.solution ? (
              <section aria-labelledby="solution">
                <h2 id="solution" className="text-2xl font-bold text-fg">Our solution</h2>
                <Markdown className="mt-4">{project.solution}</Markdown>
              </section>
            ) : null}
            {project.description ? <Markdown>{project.description}</Markdown> : null}
            {project.results.length > 0 ? (
              <section aria-labelledby="results">
                <h2 id="results" className="text-2xl font-bold text-fg">Results</h2>
                <ul className="mt-4 space-y-2">
                  {project.results.map((r) => (
                    <li key={r} className="flex gap-3 text-fg-2">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-glow" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            <div className="surface space-y-5 p-6">
              <div>
                <h2 className="text-sm font-semibold text-fg">Technologies</h2>
                <div className="mt-3">
                  <TechList items={project.technologies} />
                </div>
              </div>
              {links.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-fg">Links</h2>
                  <ul className="mt-3 space-y-2">
                    {links.map((l) => (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white">
                          {l.label} <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Link href="/work" className={buttonClasses("secondary", "md", "w-full")}>
              All projects
            </Link>
          </aside>
        </div>

        {project.screenshots.length > 0 && (
          <section aria-labelledby="screens">
            <h2 id="screens" className="mb-8 text-2xl font-bold text-fg">Screens</h2>
            <Gallery images={project.screenshots} title={project.title} />
          </section>
        )}

        <CtaPanel heading="Want something similar?" description="Tell us about your idea and timeline." primary={{ label: "Start a Project", href: "/contact" }} />
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.summary,
          url: absoluteUrl(`/work/${project.slug}`),
          ...(project.coverImage ? { image: project.coverImage } : {}),
        }}
      />
    </>
  );
}
