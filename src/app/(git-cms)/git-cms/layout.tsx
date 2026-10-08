import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cmsMode } from "@/lib/cms/config";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

/** Git-backed admin. Reached only through the /admin rewrite in src/proxy.ts. */
export default function GitCmsLayout({ children }: { children: React.ReactNode }) {
  if (cmsMode() !== "git") notFound();
  return children;
}
