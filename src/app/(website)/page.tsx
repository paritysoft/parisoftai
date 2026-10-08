import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import {
  CtaSection,
  ProcessSection,
  ProductsSection,
  ProofSection,
  ServicesSection,
  StatsSection,
  TechSection,
  WhySection,
  WorkSection,
} from "@/components/home/sections";
import { getHomeContent, listProducts, listProjects, listServices } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const [home, services, projects, products] = await Promise.all([getHomeContent(), listServices(), listProjects(), listProducts()]);

  return (
    <>
      <Hero hero={home.hero} />
      {home.sections
        .filter((s) => s.visible)
        .map((section) => {
          switch (section.key) {
            case "stats":
              return <StatsSection key={section.key} section={section} />;
            case "services":
              return <ServicesSection key={section.key} section={section} services={services} />;
            case "work":
              return <WorkSection key={section.key} section={section} projects={projects} />;
            case "products":
              return <ProductsSection key={section.key} section={section} products={products} />;
            case "why":
              return <WhySection key={section.key} section={section} />;
            case "tech":
              return <TechSection key={section.key} section={section} services={services} />;
            case "process":
              return <ProcessSection key={section.key} section={section} />;
            case "proof":
              return <ProofSection key={section.key} section={section} />;
            case "cta":
              return <CtaSection key={section.key} section={section} />;
            default:
              return null;
          }
        })}
    </>
  );
}
