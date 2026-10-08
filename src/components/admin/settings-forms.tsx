"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveSettingsAction } from "@/actions/settings";
import { purgeOldLeadsAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/admin/ui";
import { ConfirmButton, FormMessage, LinkListEditor, StringListEditor, TextArea, TextInput, Toggle, useDirty, useUnsavedChanges } from "@/components/admin/form-controls";
import { MediaField } from "@/components/admin/media";
import type { BrandingSettings, ContactFormSettings, GeneralSettings, NotificationSettings, SeoSettings } from "@/types/content";

type Res = { ok: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> };

function SettingsCard<T>({ id, title, description, settingsKey, initial, children }: { id: string; title: string; description?: string; settingsKey: string; initial: T; children: (v: T, set: (patch: Partial<T>) => void, errors: Record<string, string>) => ReactNode }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [result, setResult] = useState<Res | null>(null);
  const [pending, start] = useTransition();
  const { dirty, markSaved } = useDirty(v);
  useUnsavedChanges(dirty && !pending);
  return (
    <div id={id} className="scroll-mt-24">
      <Card title={title} description={description}>
        <div className="space-y-4">
          {children(v, (patch) => setV((p) => ({ ...p, ...patch })), result?.fieldErrors ?? {})}
          <div className="flex items-center gap-3">
            <Button
              disabled={pending || !dirty}
              onClick={() =>
                start(async () => {
                  const r = await saveSettingsAction(settingsKey, v);
                  setResult(r);
                  if (r.ok) {
                    markSaved(v);
                    router.refresh();
                  }
                })
              }
            >
              Save
            </Button>
            {dirty ? <span className="text-xs text-amber-200">Unsaved changes</span> : null}
          </div>
          <FormMessage result={result} />
        </div>
      </Card>
    </div>
  );
}

export function SettingsForms({ general, branding, seo, notifications, contactForm }: { general: GeneralSettings; branding: BrandingSettings; seo: SeoSettings; notifications: NotificationSettings; contactForm: ContactFormSettings }) {
  const [purge, setPurge] = useState<Res | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <nav aria-label="Settings sections" className="flex flex-wrap gap-2 text-sm">
        {[
          ["#general", "General"],
          ["#branding", "Branding"],
          ["#seo", "SEO defaults"],
          ["#notifications", "Notifications"],
          ["#contact-form", "Contact form"],
          ["#retention", "Data retention"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-lg border border-line px-3 py-1.5 text-fg-3 hover:text-fg">
            {label}
          </a>
        ))}
      </nav>

      <SettingsCard id="general" title="General" settingsKey="general" initial={general} description="Contact details stay hidden on the website until filled in.">
        {(v, set, e) => (
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Company name" value={v.companyName} onChange={(x) => set({ companyName: x })} error={e.companyName} />
            <TextInput label="Website URL" value={v.siteUrl} onChange={(x) => set({ siteUrl: x })} error={e.siteUrl} />
            <TextArea className="md:col-span-2" label="Company description" value={v.description} onChange={(x) => set({ description: x })} maxLength={300} rows={2} hint="Used in structured data." />
            <TextArea className="md:col-span-2" label="Footer description" value={v.footerDescription} onChange={(x) => set({ footerDescription: x })} maxLength={300} rows={2} />
            <TextInput label="Public contact email" type="email" value={v.contactEmail} onChange={(x) => set({ contactEmail: x })} error={e.contactEmail} />
            <TextInput label="Public phone number" value={v.phone} onChange={(x) => set({ phone: x })} />
            <TextInput className="md:col-span-2" label="Location" value={v.location} onChange={(x) => set({ location: x })} hint="Optional, e.g. city and country." />
            <div className="md:col-span-2">
              <MediaField label="Logo" value={v.logoUrl} onChange={(x) => set({ logoUrl: x })} hint="Optional. Leave empty to use the built-in ParitySoft AI mark." />
            </div>
            <div className="md:col-span-2">
              <MediaField label="Favicon" value={v.faviconUrl} onChange={(x) => set({ faviconUrl: x })} hint="The site currently uses the built-in icon (src/app/icon.svg). Replace that file to change the browser tab icon." />
            </div>
            <div className="md:col-span-2">
              <LinkListEditor label="Social profiles" value={v.socials} onChange={(x) => set({ socials: x })} />
            </div>
          </div>
        )}
      </SettingsCard>

      <SettingsCard id="branding" title="Branding" settingsKey="branding" initial={branding} description="Accent colours used across the public website.">
        {(v, set, e) => (
          <div className="grid gap-4 sm:grid-cols-3">
            {(["primary", "secondary", "highlight"] as const).map((k) => (
              <div key={k} className="flex items-end gap-2">
                <TextInput className="flex-1" label={`${k[0]!.toUpperCase()}${k.slice(1)} colour`} value={v[k]} onChange={(x) => set({ [k]: x } as Partial<BrandingSettings>)} error={e[k]} />
                <input type="color" aria-label={`Pick ${k} colour`} value={/^#[0-9a-f]{6}$/i.test(v[k]) ? v[k] : "#000000"} onChange={(ev) => set({ [k]: ev.target.value.toUpperCase() } as Partial<BrandingSettings>)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-transparent" />
              </div>
            ))}
            <p className="text-xs text-fg-3 sm:col-span-3">Check text contrast after changing colours — buttons use white text on the primary/secondary gradient.</p>
          </div>
        )}
      </SettingsCard>

      <SettingsCard id="seo" title="SEO defaults" settingsKey="seo" initial={seo}>
        {(v, set, e) => (
          <div className="space-y-4">
            <TextInput label="Default title (homepage)" value={v.defaultTitle} onChange={(x) => set({ defaultTitle: x })} maxLength={70} error={e.defaultTitle} />
            <TextInput label="Title template" value={v.titleTemplate} onChange={(x) => set({ titleTemplate: x })} error={e.titleTemplate} hint="%s is replaced by the page title." />
            <TextArea label="Default meta description" value={v.defaultDescription} onChange={(x) => set({ defaultDescription: x })} maxLength={170} rows={3} error={e.defaultDescription} />
            <MediaField label="Default Open Graph image" value={v.ogImage} onChange={(x) => set({ ogImage: x })} hint="1200×630. Leave empty to use the generated image." />
          </div>
        )}
      </SettingsCard>

      <SettingsCard id="notifications" title="Notifications" settingsKey="notifications" initial={notifications} description="Who receives an email when a new inquiry arrives. API keys live in Vercel environment variables, never here.">
        {(v, set, e) => (
          <div className="space-y-4">
            <Toggle label="Email new inquiries" checked={v.enabled} onChange={(b) => set({ enabled: b })} />
            <StringListEditor label="Recipients" value={v.recipients} onChange={(x) => set({ recipients: x })} placeholder="name@company.com" hint="If empty, CONTACT_NOTIFICATION_EMAIL from the environment is used." />
            {Object.entries(e).map(([k, m]) => (
              <p key={k} className="text-xs text-red-300">
                {m}
              </p>
            ))}
          </div>
        )}
      </SettingsCard>

      <SettingsCard id="contact-form" title="Contact form" settingsKey="contact_form" initial={contactForm}>
        {(v, set, e) => (
          <div className="space-y-4">
            <StringListEditor label="Budget options" value={v.budgetOptions} onChange={(x) => set({ budgetOptions: x })} hint="Ranges shown to visitors. Leave empty to hide the field." />
            <StringListEditor label="Timeline options" value={v.timelineOptions} onChange={(x) => set({ timelineOptions: x })} />
            <TextArea label="Consent text" value={v.consentText} onChange={(x) => set({ consentText: x })} maxLength={400} rows={3} error={e.consentText} />
            <TextInput label="Keep inquiries for (days)" type="number" value={String(v.retentionDays)} onChange={(x) => set({ retentionDays: Number(x) || 0 })} error={e.retentionDays} hint="Used by the retention clean-up below. Match this to your privacy policy." />
          </div>
        )}
      </SettingsCard>

      <div id="retention" className="scroll-mt-24">
        <Card title="Data retention" description="Delete inquiries older than the retention period set above.">
          <ConfirmButton confirmText="Permanently delete all inquiries older than the retention period? This cannot be undone." onConfirm={() => start(async () => setPurge(await purgeOldLeadsAction()))} disabled={pending}>
            Delete old inquiries
          </ConfirmButton>
          <div className="mt-3">
            <FormMessage result={purge} />
          </div>
        </Card>
      </div>
    </div>
  );
}
