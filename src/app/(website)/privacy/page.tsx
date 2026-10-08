import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GenericPage } from "@/components/website/generic-page";
import { getPageContent } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/privacy", title: "Privacy Policy", description: "How ParitySoft AI collects, uses and protects information submitted through this website." });
}

export default async function Page() {
  const content = await getPageContent("privacy");
  if (!content) notFound();
  return <GenericPage content={content} path="/privacy" label="Privacy Policy" />;
}
