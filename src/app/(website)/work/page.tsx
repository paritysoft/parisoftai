import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { WorkGrid } from "@/components/website/work-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { CtaPanel } from "@/components/home/sections";
import { listProjects } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/work",
    title: "Our Work",
    description: "Selected mobile, desktop and software projects by ParitySoft AI, with platforms, technologies and case studies.",
  });
}

export default async function WorkPage() {
  const projects = await listProjects();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Our Work", href: "/work" }]}
        heading="Our work"
        intro="Projects we have designed and engineered. Client work is shown only with permission; our own products are labeled as such."
      />
      <section aria-label="Projects" className="container-site pb-24">
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="size-8" aria-hidden="true" />}
            title="Case studies are on the way"
            description="We're preparing detailed write-ups of selected projects. In the meantime, we're happy to walk you through relevant work on a call."
            action={
              <Link href="/contact" className={buttonClasses("primary", "md")}>
                Talk to us
              </Link>
            }
          />
        ) : (
          <WorkGrid projects={projects} />
        )}
        <div className="mt-24">
          <CtaPanel heading="Have a product in mind?" description="Let's talk about what you want to build." primary={{ label: "Start a Project", href: "/contact" }} />
        </div>
      </section>
    </>
  );
}
