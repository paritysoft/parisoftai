"use server";

import { ActionError, dbError, withPermission, type ActionResult } from "@/lib/auth/actions";
import { audit } from "@/lib/audit";
import { revalidatePublicSite } from "@/lib/revalidate";
import { settingsSchemas, seoOverrideSchema, zodFieldErrors, type SettingsKey } from "@/lib/validation/content";

export async function saveSettingsAction(key: string, value: unknown): Promise<ActionResult> {
  return withPermission("settings.manage", async (ctx) => {
    if (!(key in settingsSchemas)) throw new ActionError("Unknown settings group.");
    const schema = settingsSchemas[key as SettingsKey];
    const parsed = schema.safeParse(value);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    const { error } = await ctx.supabase.from("site_settings").upsert({ key, value: parsed.data }, { onConflict: "key" });
    if (error) dbError(error, "settings");
    await audit(ctx, "settings.update", "settings", key, `Updated ${key} settings`);
    if (key !== "notifications") revalidatePublicSite();
    return { ok: true, message: "Settings saved." };
  });
}

export async function saveSeoOverrideAction(input: unknown): Promise<ActionResult> {
  return withPermission("seo.manage", async (ctx) => {
    const parsed = seoOverrideSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    const v = parsed.data;
    const { error } = await ctx.supabase.from("seo_metadata").upsert(
      {
        path: v.path,
        title: v.title,
        description: v.description,
        og_title: v.ogTitle,
        og_description: v.ogDescription,
        og_image: v.ogImage,
        canonical_url: v.canonicalUrl,
        noindex: v.noindex,
      },
      { onConflict: "path" },
    );
    if (error) dbError(error, "SEO settings");
    await audit(ctx, "seo.update", "seo", v.path, `Updated SEO for ${v.path}${v.noindex ? " (noindex)" : ""}`);
    revalidatePublicSite(v.path);
    return { ok: true, message: "SEO saved." };
  });
}

export async function deleteSeoOverrideAction(path: string): Promise<ActionResult> {
  return withPermission("seo.manage", async (ctx) => {
    const { error } = await ctx.supabase.from("seo_metadata").delete().eq("path", path);
    if (error) dbError(error, "SEO settings");
    await audit(ctx, "seo.reset", "seo", path, `Reset SEO for ${path}`);
    revalidatePublicSite(path);
    return { ok: true, message: "Override removed. Defaults apply again." };
  });
}
