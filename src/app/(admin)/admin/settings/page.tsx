import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsForms } from "@/components/admin/settings-forms";
import { requirePage } from "@/lib/auth/session";
import { notificationSeed, settingsSeed } from "@/content/settings";
import type { NotificationSettings, SiteSettings } from "@/types/content";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requirePage("settings.manage");
  const { data } = await supabase.from("site_settings").select("key, value");
  const get = <K extends keyof SiteSettings>(k: K): SiteSettings[K] => ({ ...settingsSeed[k], ...((data ?? []).find((r) => r.key === k)?.value ?? {}) });
  const notifications: NotificationSettings = { ...notificationSeed, ...((data ?? []).find((r) => r.key === "notifications")?.value ?? {}) };
  return (
    <>
      <AdminPageHeader title="Settings" description="Website configuration. Secrets such as API keys are never stored here." />
      <SettingsForms general={get("general")} branding={get("branding")} seo={get("seo")} notifications={notifications} contactForm={get("contact_form")} />
    </>
  );
}
