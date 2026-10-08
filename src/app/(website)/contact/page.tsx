import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/website/page-hero";
import { BlockRenderer } from "@/components/website/block-renderer";
import { ContactForm } from "@/components/forms/contact-form";
import { buttonClasses } from "@/components/ui/button";
import { getPageContent, getSiteSettings, listServices } from "@/lib/content/repository";
import { pageSeeds } from "@/content/pages";
import { buildMetadata } from "@/lib/seo";
import { contactDelivery } from "@/lib/leads/server-deps";
import type { GenericPageContent } from "@/types/content";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/contact",
    title: "Contact Us — Start a Project",
    description: "Tell ParitySoft AI about your mobile, desktop or AI software project. We read every inquiry and reply with next steps.",
  });
}

export default async function ContactPage() {
  const [content, settings, services] = await Promise.all([getPageContent("contact"), getSiteSettings(), listServices()]);
  const page = content ?? (pageSeeds.contact.content as GenericPageContent);
  const { general, contact_form: form } = settings;
  const serviceOptions = [...services.map((s) => s.title), "Other / not sure yet"];

  return (
    <>
      <PageHero crumbs={[{ label: "Contact", href: "/contact" }]} heading={page.heading} intro={page.intro} />
      <div className="container-site grid gap-12 pb-20 sm:pb-24 lg:grid-cols-[1.5fr_1fr]">
        {contactDelivery() !== "none" || process.env.NODE_ENV !== "production" ? (
          <ContactForm services={serviceOptions} budgetOptions={form.budgetOptions} timelineOptions={form.timelineOptions} consentText={form.consentText} />
        ) : (
          <section aria-labelledby="inquiry-unavailable" className="surface flex flex-col items-start gap-4 p-8">
            <h2 id="inquiry-unavailable" className="text-xl font-semibold text-fg">
              {general.contactEmail ? "Send us your project details by email" : "Online inquiries are temporarily unavailable"}
            </h2>
            <p className="text-fg-2">
              {general.contactEmail
                ? "Email us with your goals, target platforms and timeline, and we'll reply with next steps."
                : "Our inquiry form is being connected. Please check back shortly."}
            </p>
            {general.contactEmail ? (
              <a href={`mailto:${general.contactEmail}?subject=${encodeURIComponent("Project inquiry")}`} className={buttonClasses("primary", "md")}>
                <Mail className="size-4" aria-hidden="true" /> {general.contactEmail}
              </a>
            ) : null}
          </section>
        )}
        <aside id="details" className="space-y-10" aria-label="Contact details">
          <ul className="space-y-5">
            <li className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-ink-800 text-indigo-200">
                <Clock className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-fg">What happens next</p>
                <p className="text-sm leading-relaxed text-fg-3">We review your inquiry and reply by email with questions or a time to talk.</p>
              </div>
            </li>
            {general.contactEmail ? (
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-ink-800 text-indigo-200">
                  <Mail className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-fg">Email</p>
                  <a href={`mailto:${general.contactEmail}`} className="text-sm text-fg-2 hover:text-fg">
                    {general.contactEmail}
                  </a>
                </div>
              </li>
            ) : null}
            {general.phone ? (
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-ink-800 text-indigo-200">
                  <Phone className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-fg">Phone</p>
                  <a href={`tel:${general.phone.replace(/[^+\d]/g, "")}`} className="text-sm text-fg-2 hover:text-fg">
                    {general.phone}
                  </a>
                </div>
              </li>
            ) : null}
            {general.location ? (
              <li className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-ink-800 text-indigo-200">
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-fg">Location</p>
                  <p className="text-sm text-fg-2">{general.location}</p>
                </div>
              </li>
            ) : null}
          </ul>
          <BlockRenderer blocks={page.blocks} />
        </aside>
      </div>
    </>
  );
}
