import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GenericPage } from "@/components/website/generic-page";
import { getPageContent } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/terms", title: "Terms of Use", description: "Terms that apply when you use the ParitySoft AI website." });
}

export default async function Page() {
  const content = await getPageContent("terms");
  if (!content) notFound();
  return <GenericPage content={content} path="/terms" label="Terms" />;
}
