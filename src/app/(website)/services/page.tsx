import type { Metadata } from "next";
import { PageHero } from "@/components/website/page-hero";
import { ServiceCard } from "@/components/website/service-card";
import { CtaPanel } from "@/components/home/sections";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { listServices } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/services",
    title: "App & Custom Software Development Services",
    description:
      "iOS, Android, Flutter, macOS and Windows app development, backend APIs, AI integration, UI/UX design and app maintenance from ParitySoft AI.",
  });
}

export default async function ServicesPage() {
  const services = await listServices();
  return (
    <>
      <PageHero
        crumbs={[{ label: "Services", href: "/services" }]}
        heading="Software development services"
        intro="Mobile, desktop and AI-powered software, designed and engineered end to end. Choose a service to see how we approach it."
      />
      <section aria-label="Services" className="container-site pb-20 sm:pb-24">
        {services.length === 0 ? (
          <EmptyState title="Services are being updated" description="Please check back soon, or contact us about your project." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((s) => (
              <Reveal as="li" key={s.id}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </ul>
        )}
        <div className="mt-16 sm:mt-20">
          <CtaPanel
            heading="Not sure which service fits?"
            description="Describe what you want to build and we'll recommend an approach."
            primary={{ label: "Start a Project", href: "/contact" }}
          />
        </div>
      </section>
    </>
  );
}
