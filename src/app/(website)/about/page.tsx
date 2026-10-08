import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GenericPage } from "@/components/website/generic-page";
import { getPageContent } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/about", title: "About Us", description: "ParitySoft AI is a software development company focused on mobile and desktop applications, AI features and digital product engineering." });
}

export default async function Page() {
  const content = await getPageContent("about");
  if (!content) notFound();
  return <GenericPage content={content} path="/about" label="About" />;
}
