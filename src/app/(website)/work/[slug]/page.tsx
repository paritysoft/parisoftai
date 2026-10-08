import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { PlatformBadges, TechList } from "@/components/website/platform-badges";
import { Gallery } from "@/components/website/gallery";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { CtaPanel } from "@/components/home/sections";
import { JsonLd } from "@/components/website/json-ld";
import { findRedirect, getProject, listProjects } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";
import { projectJsonLd } from "@/lib/structured-data";
import { formatDate, safeHref } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return buildMetadata({
    path: `/work/${slug}`,
    title: project.seoTitle ?? `${project.title} — ${project.category} Project`,
    description: project.seoDescription ?? project.summary,
    image: project.ogImage ?? project.coverImage,
    type: "article",
  });
}

function projectLinks(project: NonNullable<Awaited<ReturnType<typeof getProject>>>) {
  const primary = [
    { label: "Visit project", url: project.projectUrl },
    { label: "App Store", url: project.appStoreUrl },
    { label: "Google Play", url: project.googlePlayUrl },
    { label: "Microsoft Store", url: project.microsoftStoreUrl },
  ];
  return [...primary, ...project.externalLinks]
    .map((l) => ({ label: l.label, url: safeHref(l.url) }))
    .filter((l): l is { label: string; url: string } => Boolean(l.url && l.label && l.url.startsWith("https://")))
    .filter((l, i, all) => all.findIndex((x) => x.url === l.url) === i);
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) {
    const to = await findRedirect(`/work/${slug}`);
    if (to) permanentRedirect(to);
    notFound();
  }
  const links = projectLinks(project);
  const hasBody = Boolean(project.challenge || project.solution || project.description || project.results.length || project.keyFeatures.length);

  return (
    <>
      <PageHero crumbs={[{ label: "Our Work", href: "/work" }, { label: project.title, href: `/work/${project.slug}` }]} heading={project.title} intro={project.summary}>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-fg-3">
          <Badge tone={project.ownership === "company" ? "glow" : "neutral"}>{project.ownership === "company" ? "ParitySoft AI product" : "Client project"}</Badge>
          <span>{project.category}</span>
          <PlatformBadges platforms={project.platforms} />
        </div>
        {project.attribution ? <p className="mt-4 text-sm text-fg-3">{project.attribution}</p> : null}
      </PageHero>

      <div className="container-site space-y-16 pb-20 sm:space-y-20 sm:pb-24">
        {project.coverImage ? (
          <div className="surface relative aspect-[16/9] overflow-hidden">
            <SmartImage src={project.coverImage} alt={`${project.title} cover`} priority sizes="(min-width: 1280px) 1216px, 100vw" />
          </div>
        ) : null}

        <div className={hasBody ? "grid gap-12 lg:grid-cols-[1fr_320px]" : "max-w-md"}>
          {hasBody ? (
            <div className="min-w-0 space-y-12">
              {project.description ? <Markdown>{project.description}</Markdown> : null}
              {project.keyFeatures.length > 0 ? (
                <section aria-labelledby="features">
                  <h2 id="features" className="text-2xl font-bold text-fg">
                    Key features
                  </h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {project.keyFeatures.map((f) => (
                      <li key={f} className="flex gap-3 text-fg-2">
                        <Check className="mt-1 size-4 shrink-0 text-glow" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {project.challenge ? (
                <section aria-labelledby="challenge">
                  <h2 id="challenge" className="text-2xl font-bold text-fg">
                    The challenge
                  </h2>
                  <Markdown className="mt-4">{project.challenge}</Markdown>
                </section>
              ) : null}
              {project.solution ? (
                <section aria-labelledby="solution">
                  <h2 id="solution" className="text-2xl font-bold text-fg">
                    Our solution
                  </h2>
                  <Markdown className="mt-4">{project.solution}</Markdown>
                </section>
              ) : null}
              {project.results.length > 0 ? (
                <section aria-labelledby="results">
                  <h2 id="results" className="text-2xl font-bold text-fg">
                    Results
                  </h2>
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
          ) : null}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start" aria-label="Project details">
            <div className="surface space-y-5 p-6">
              {project.technologies.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold text-fg">Technologies</h2>
                  <div className="mt-3">
                    <TechList items={project.technologies} />
                  </div>
                </div>
              ) : null}
              {links.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-fg">Links</h2>
                  <ul className="mt-3 space-y-2">
                    {links.map((l) => (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white">
                          {l.label} <ExternalLink className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.publishedAt ? <p className="text-xs text-fg-3">Published {formatDate(project.publishedAt)}</p> : null}
            </div>
            <Link href="/work" className={buttonClasses("secondary", "md", "w-full")}>
              View all projects
            </Link>
          </aside>
        </div>

        {project.screenshots.length > 0 && (
          <section aria-labelledby="screens">
            <h2 id="screens" className="mb-8 text-2xl font-bold text-fg">
              Screens
            </h2>
            <Gallery images={project.screenshots} title={project.title} />
          </section>
        )}

        <CtaPanel heading="Want something similar?" description="Tell us about your idea and timeline." primary={{ label: "Start a Project", href: "/contact" }} secondary={{ label: "Explore our services", href: "/services" }} />
      </div>
      <JsonLd data={projectJsonLd(project)} />
    </>
  );
}
