import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { safeHref } from "@/lib/utils";
import type { Product, Service, SiteSettings } from "@/types/content";

export function SiteFooter({ settings, services, products }: { settings: SiteSettings; services: Service[]; products: Product[] }) {
  const { general } = settings;
  const year = new Date().getFullYear();
  const socials = general.socials.map((s) => ({ ...s, url: safeHref(s.url) })).filter((s) => s.url && s.label);

  const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    { title: "Services", links: services.slice(0, 8).map((s) => ({ label: s.title, href: `/services/${s.slug}` })) },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Our Work", href: "/work" },
        { label: "Products", href: "/products" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];
  if (products.length > 0) {
    columns.push({ title: "Products", links: products.slice(0, 6).map((p) => ({ label: p.name, href: `/products/${p.slug}` })) });
  }

  return (
    <footer className="relative border-t border-line bg-ink-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-accent),var(--color-glow),transparent)] opacity-60"
      />
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <Link href="/" aria-label={`${general.companyName} home`} className="inline-block rounded-lg">
            <Logo name={general.companyName} logoUrl={general.logoUrl || undefined} />
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-fg-3">{general.footerDescription}</p>
          {(general.contactEmail || general.phone || general.location) && (
            <address className="mt-6 space-y-1.5 text-sm not-italic text-fg-2">
              {general.contactEmail ? (
                <p>
                  <a href={`mailto:${general.contactEmail}`} className="hover:text-fg">
                    {general.contactEmail}
                  </a>
                </p>
              ) : null}
              {general.phone ? (
                <p>
                  <a href={`tel:${general.phone.replace(/[^+\d]/g, "")}`} className="hover:text-fg">
                    {general.phone}
                  </a>
                </p>
              ) : null}
              {general.location ? <p className="text-fg-3">{general.location}</p> : null}
            </address>
          )}
          {socials.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Social profiles">
              {socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url!} target="_blank" rel="noopener noreferrer me" className="text-fg-3 hover:text-fg">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="font-display text-sm font-semibold text-fg">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-fg-3 transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line/70">
        <div className="container-site flex flex-col gap-3 py-6 text-sm text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {general.companyName}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="hover:text-fg">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-fg">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
