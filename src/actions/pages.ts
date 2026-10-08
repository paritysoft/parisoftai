"use server";

import { ActionError, dbError, withPermission, type ActionResult } from "@/lib/auth/actions";
import { audit } from "@/lib/audit";
import { revalidatePublicSite } from "@/lib/revalidate";
import { genericPageSchema, homeContentSchema, zodFieldErrors } from "@/lib/validation/content";

const PATHS: Record<string, string> = { home: "/", about: "/about", contact: "/contact", privacy: "/privacy", terms: "/terms" };

async function loadPage(supabase: import("@supabase/supabase-js").SupabaseClient, pageId: string) {
  const { data } = await supabase.from("pages").select("id, key, title").eq("id", pageId).maybeSingle();
  if (!data) throw new ActionError("Page not found.");
  return data as { id: string; key: string; title: string };
}

function validate(key: string, content: unknown) {
  const schema = key === "home" ? homeContentSchema : genericPageSchema;
  const parsed = schema.safeParse(content);
  if (!parsed.success) throw new ActionError("Some fields need attention before saving.", zodFieldErrors(parsed.error));
  return parsed.data;
}

/** Saves a draft revision. Drafts are only visible in the admin and in preview mode. */
export async function savePageDraftAction(pageId: string, content: unknown, note?: string): Promise<ActionResult> {
  return withPermission("content.edit", async (ctx) => {
    const page = await loadPage(ctx.supabase, pageId);
    const value = validate(page.key, content);
    const { error } = await ctx.supabase.from("page_revisions").insert({ page_id: page.id, kind: "draft", content: value, note: note?.slice(0, 300) ?? null, created_by: ctx.user.id });
    if (error) dbError(error, "draft");
    await audit(ctx, "page.save_draft", "page", page.id, `Saved draft of ${page.title}`);
    return { ok: true, message: "Draft saved. It is not visible on the website until published." };
  });
}

export async function publishPageAction(pageId: string, content: unknown): Promise<ActionResult> {
  return withPermission("content.publish", async (ctx) => {
    const page = await loadPage(ctx.supabase, pageId);
    const value = validate(page.key, content);
    const { error: revError } = await ctx.supabase.from("page_revisions").insert({ page_id: page.id, kind: "published", content: value, created_by: ctx.user.id });
    if (revError) dbError(revError, "revision");
    const { data, error } = await ctx.supabase
      .from("pages")
      .update({ published_content: value, status: "published", published_at: new Date().toISOString(), published_by: ctx.user.id })
      .eq("id", page.id)
      .select("id");
    if (error) dbError(error, "page");
    if (!data?.length) throw new ActionError("You don't have permission to publish this page.");
    await audit(ctx, "page.publish", "page", page.id, `Published ${page.title}`);
    revalidatePublicSite(PATHS[page.key] ?? "/");
    return { ok: true, message: "Published. The website has been updated." };
  });
}
