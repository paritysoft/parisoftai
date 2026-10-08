import type { CSSProperties } from "react";
import { draftMode } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PreviewBanner } from "@/components/website/preview-banner";
import { JsonLd } from "@/components/website/json-ld";
import { getSiteSettings, listProducts, listServices } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";
import { safeHref } from "@/lib/utils";

const HEX = /^#[0-9a-fA-F]{6}$/;

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services, products, draft] = await Promise.all([getSiteSettings(), listServices(), listProducts(), draftMode()]);
  const { branding, general } = settings;
  const brandVars = {
    ...(HEX.test(branding.primary) ? { "--brand-primary": branding.primary } : {}),
    ...(HEX.test(branding.secondary) ? { "--brand-secondary": branding.secondary } : {}),
    ...(HEX.test(branding.highlight) ? { "--brand-highlight": branding.highlight } : {}),
  } as CSSProperties;

  const sameAs = general.socials.map((s) => safeHref(s.url)).filter((u): u is string => Boolean(u && /^https:/.test(u)));

  return (
    <div style={brandVars} className="flex min-h-dvh flex-col">
      {draft.isEnabled ? <PreviewBanner /> : null}
      <SiteHeader companyName={general.companyName} logoUrl={general.logoUrl || undefined} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} services={services} products={products} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: general.companyName,
          url: absoluteUrl("/"),
          description: general.description,
          ...(general.logoUrl ? { logo: general.logoUrl } : {}),
          ...(general.contactEmail ? { email: general.contactEmail } : {}),
          ...(sameAs.length ? { sameAs } : {}),
        }}
      />
      <Analytics />
    </div>
  );
}
