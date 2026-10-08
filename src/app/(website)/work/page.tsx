import type { Metadata } from "next";
import { PageHero } from "@/components/website/page-hero";
import { WorkGrid } from "@/components/website/work-grid";
import { TechExpertise } from "@/components/website/capabilities";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { SectionHeader } from "@/components/ui/section-header";
import { CtaPanel } from "@/components/home/sections";
import { getHomeContent, listProjects, listServices } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const projects = await listProjects();
  return buildMetadata({
    path: "/work",
    title: "Our Work — App & Software Projects",
    description:
      projects.length > 0
        ? "Mobile, desktop and AI software projects by ParitySoft AI, with platforms, technology stacks and project details."
        : "The mobile, desktop and AI engineering ParitySoft AI delivers — platforms, technologies and a clear delivery process. Case studies are published with client permission.",
  });
}

export default async function WorkPage() {
  const [projects, services, home] = await Promise.all([listProjects(), listServices(), getHomeContent()]);
  const hasProjects = projects.length > 0;
  const process = home.sections.find((s) => s.key === "process");
  const steps = process && "items" in process ? process.items : [];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Our Work", href: "/work" }]}
        heading={hasProjects ? "Our work" : "Engineering we deliver"}
        intro={
          hasProjects
            ? "Projects we have designed and engineered. Client work is shown only with permission; our own products are labeled as such."
            : "Case studies are published here with each client's permission. Meanwhile, here is the engineering we deliver and how we work — and we're happy to walk you through relevant experience on a call."
        }
      />

      {hasProjects ? (
        <section aria-label="Projects" className="container-site pb-16 sm:pb-20">
          <WorkGrid projects={projects} />
        </section>
      ) : (
        <>
          <section aria-labelledby="capabilities" className="container-site pb-16 sm:pb-20">
            <SectionHeader id="capabilities" heading="Platforms and technologies" description="Each area links to the full service description." />
            <div className="mt-10">
              <TechExpertise services={services} />
            </div>
          </section>
          {steps.length > 0 ? (
            <section aria-labelledby="delivery" className="container-site pb-16 sm:pb-20">
              <SectionHeader id="delivery" heading="How we deliver" description={process?.description} />
              <div className="mt-12">
                <ProcessTimeline steps={steps} />
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="container-site pb-20 sm:pb-24">
        <CtaPanel
          heading={hasProjects ? "Have a product in mind?" : "Want to see relevant examples?"}
          description={hasProjects ? "Let's talk about what you want to build." : "Tell us about your project and we'll share experience that matches your platform and goals."}
          primary={{ label: "Start a Project", href: "/contact" }}
          secondary={{ label: "Explore our services", href: "/services" }}
        />
      </div>
    </>
  );
}
