"use server";

import { z } from "zod";
import { ActionError, dbError, withPermission, type ActionResult } from "@/lib/auth/actions";
import { audit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { MAX_UPLOAD_BYTES, sniffImageType, svgIsSafe } from "@/lib/media/validate";

export interface MediaAsset {
  id: string;
  path: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  title: string | null;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toAsset = (r: any): MediaAsset => ({
  id: r.id,
  path: r.path,
  publicUrl: r.public_url,
  fileName: r.file_name,
  mimeType: r.mime_type,
  sizeBytes: r.size_bytes,
  width: r.width,
  height: r.height,
  altText: r.alt_text,
  title: r.title,
  createdAt: r.created_at,
});

export async function listMediaAction(query = "", limit = 60): Promise<ActionResult<MediaAsset[]>> {
  return withPermission("media.upload", async (ctx) => {
    let q = ctx.supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(Math.min(limit, 200));
    const term = query.trim().replace(/[%_,()]/g, "");
    if (term) q = q.or(`file_name.ilike.%${term}%,alt_text.ilike.%${term}%,title.ilike.%${term}%`);
    const { data, error } = await q;
    if (error) dbError(error, "media");
    return { ok: true, data: (data ?? []).map(toAsset) };
  });
}

const registerSchema = z.object({
  path: z.string().regex(/^uploads\/\d{4}\/\d{2}\/[a-z0-9-]+\.(png|jpg|webp|avif|svg)$/),
  fileName: z.string().trim().min(1).max(200),
  width: z.number().int().positive().max(20000).nullable(),
  height: z.number().int().positive().max(20000).nullable(),
  altText: z.string().trim().max(200).default(""),
});

/**
 * Called after the browser uploads a file directly to Supabase Storage (RLS restricts uploads to
 * staff). The server re-reads the stored object and verifies its real type, size and SVG safety;
 * anything that fails is deleted before a media record is created.
 */
export async function registerMediaAction(input: unknown): Promise<ActionResult<MediaAsset>> {
  return withPermission("media.upload", async (ctx) => {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("Invalid upload.");
    const { path, fileName, width, height, altText } = parsed.data;
    const storage = ctx.supabase.storage.from("media");

    const discard = async () => {
      const remover = isServiceRoleConfigured() ? createServiceClient().storage.from("media") : storage;
      await remover.remove([path]);
    };

    const { data: blob, error: dlError } = await storage.download(path);
    if (dlError || !blob) throw new ActionError("The upload could not be verified. Please try again.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      await discard();
      throw new ActionError("Images must be 5 MB or smaller.");
    }
    const mime = sniffImageType(bytes);
    const ext = path.split(".").pop();
    const extMime = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", avif: "image/avif", svg: "image/svg+xml" }[ext ?? ""];
    if (!mime || mime !== extMime) {
      await discard();
      throw new ActionError("That file isn't a supported image. Use PNG, JPEG, WebP, AVIF or SVG.");
    }
    if (mime === "image/svg+xml") {
      if (!can(ctx.user.role, "content.publish")) {
        await discard();
        throw new ActionError("Only admins can upload SVG files.");
      }
      if (!svgIsSafe(new TextDecoder().decode(bytes))) {
        await discard();
        throw new ActionError("This SVG contains scripts or external references and was rejected.");
      }
    }

    const { data: pub } = storage.getPublicUrl(path);
    const { data, error } = await ctx.supabase
      .from("media_assets")
      .insert({ path, public_url: pub.publicUrl, file_name: fileName.slice(0, 200), mime_type: mime, size_bytes: bytes.byteLength, width, height, alt_text: altText, uploaded_by: ctx.user.id })
      .select("*")
      .single();
    if (error) {
      await discard();
      dbError(error, "media");
    }
    await audit(ctx, "media.upload", "media", data.id, `Uploaded ${fileName.slice(0, 80)}`);
    return { ok: true, message: "Uploaded.", data: toAsset(data) };
  });
}

const metaSchema = z.object({ altText: z.string().trim().max(200), title: z.string().trim().max(120) });

export async function updateMediaAction(id: string, input: unknown): Promise<ActionResult> {
  return withPermission("media.upload", async (ctx) => {
    const parsed = metaSchema.safeParse(input);
    if (!parsed.success) throw new ActionError("Alt text must be 200 characters or fewer.");
    const { error } = await ctx.supabase.from("media_assets").update({ alt_text: parsed.data.altText, title: parsed.data.title || null }).eq("id", id);
    if (error) dbError(error, "media");
    return { ok: true, message: "Details saved." };
  });
}

/** Counts references to an asset URL across content so admins don't delete images in use. */
export async function mediaUsageAction(url: string): Promise<ActionResult<{ where: string[] }>> {
  return withPermission("media.upload", async (ctx) => {
    const where: string[] = [];
    const checks: [string, string, string][] = [
      ["services", "title", "Service"],
      ["portfolio_projects", "title", "Project"],
      ["products", "name", "Product"],
      ["pages", "title", "Page"],
      ["site_settings", "key", "Settings"],
      ["seo_metadata", "path", "SEO"],
    ];
    for (const [table, label, kind] of checks) {
      const { data } = await ctx.supabase.from(table).select("*");
      for (const row of data ?? []) if (JSON.stringify(row).includes(url)) where.push(`${kind}: ${row[label]}`);
    }
    for (const [table, kind] of [["portfolio_images", "Project gallery"], ["product_images", "Product gallery"]] as const) {
      const { count } = await ctx.supabase.from(table).select("id", { count: "exact", head: true }).eq("url", url);
      if (count) where.push(`${kind} (${count})`);
    }
    const { data: revs } = await ctx.supabase.from("page_revisions").select("page_id, content").order("created_at", { ascending: false }).limit(50);
    if ((revs ?? []).some((r) => JSON.stringify(r.content).includes(url))) where.push("Page drafts");
    return { ok: true, data: { where } };
  });
}

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  return withPermission("media.delete", async (ctx) => {
    const { data: asset } = await ctx.supabase.from("media_assets").select("id, path, file_name").eq("id", id).maybeSingle();
    if (!asset) throw new ActionError("File not found.");
    const { error: rmError } = await ctx.supabase.storage.from("media").remove([asset.path]);
    if (rmError) throw new ActionError("Could not delete the file from storage.");
    const { error } = await ctx.supabase.from("media_assets").delete().eq("id", id);
    if (error) dbError(error, "media");
    await audit(ctx, "media.delete", "media", id, `Deleted ${asset.file_name}`);
    return { ok: true, message: "Deleted." };
  });
}
