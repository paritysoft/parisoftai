import "server-only";
import type { z } from "zod";
import { ActionError, dbError, withPermission, type ActionContext, type ActionResult } from "@/lib/auth/actions";
import { audit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { revalidatePublicSite } from "@/lib/revalidate";
import { productToRow, projectToRow, serviceToRow } from "@/lib/content/mappers";
import { productSchema, projectSchema, serviceSchema, zodFieldErrors } from "@/lib/validation/content";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CollectionConfig {
  table: "services" | "portfolio_projects" | "products";
  resource: string;
  label: string;
  publicPrefix: string;
  schema: z.ZodType<any, any>;
  toRow: (v: any) => Record<string, unknown>;
  images?: { table: "portfolio_images" | "product_images"; fk: "project_id" | "product_id" };
  nameField: "title" | "name";
}

export const COLLECTIONS = {
  services: { table: "services", resource: "service", label: "service", publicPrefix: "/services/", schema: serviceSchema, toRow: serviceToRow, nameField: "title" },
  portfolio: {
    table: "portfolio_projects",
    resource: "portfolio_project",
    label: "project",
    publicPrefix: "/work/",
    schema: projectSchema,
    toRow: projectToRow,
    images: { table: "portfolio_images", fk: "project_id" },
    nameField: "title",
  },
  products: {
    table: "products",
    resource: "product",
    label: "product",
    publicPrefix: "/products/",
    schema: productSchema,
    toRow: productToRow,
    images: { table: "product_images", fk: "product_id" },
    nameField: "name",
  },
} as const satisfies Record<string, CollectionConfig>;

export type CollectionKey = keyof typeof COLLECTIONS;

async function replaceImages(ctx: ActionContext, cfg: CollectionConfig, id: string, images: { url: string; alt: string }[]) {
  if (!cfg.images) return;
  const { error: delError } = await ctx.supabase.from(cfg.images.table).delete().eq(cfg.images.fk, id);
  if (delError) dbError(delError, "images");
  if (images.length === 0) return;
  const { error } = await ctx.supabase.from(cfg.images.table).insert(images.map((img, i) => ({ [cfg.images!.fk]: id, url: img.url, alt: img.alt, sort_order: i })));
  if (error) dbError(error, "images");
}

export async function saveCollectionItem(key: CollectionKey, id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const cfg: CollectionConfig = COLLECTIONS[key];
  return withPermission("content.edit", async (ctx) => {
    const parsed = cfg.schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
    const value = parsed.data;
    const canPublish = can(ctx.user.role, "content.publish");
    if (!canPublish && value.status !== "draft") {
      throw new ActionError("Editors can save drafts only. Ask an admin to publish or archive.");
    }
    const row = cfg.toRow(value);

    let savedId = id;
    let previousStatus: string | null = null;
    if (id) {
      const { data: existing } = await ctx.supabase.from(cfg.table).select("status").eq("id", id).maybeSingle();
      if (!existing) throw new ActionError(`This ${cfg.label} no longer exists.`);
      previousStatus = existing.status;
      if (!canPublish && existing.status !== "draft") {
        throw new ActionError(`This ${cfg.label} is ${existing.status}. Only admins can edit published or archived content.`);
      }
      const { data, error } = await ctx.supabase.from(cfg.table).update(row).eq("id", id).select("id");
      if (error) dbError(error, cfg.label);
      if (!data?.length) throw new ActionError("You don't have permission to change this item.");
    } else {
      const { data, error } = await ctx.supabase.from(cfg.table).insert(row).select("id").single();
      if (error) dbError(error, cfg.label);
      savedId = data.id;
    }
    if (cfg.images && "screenshots" in value) await replaceImages(ctx, cfg, savedId!, value.screenshots);

    const name = value[cfg.nameField];
    const published = value.status === "published";
    const action = !id ? "create" : previousStatus !== "published" && published ? "publish" : previousStatus === "published" && !published ? "unpublish" : "update";
    await audit(ctx, `${cfg.resource}.${action}`, cfg.resource, savedId, `${action} ${cfg.label} "${name}" (${value.status})`);
    if (published || previousStatus === "published") revalidatePublicSite(`${cfg.publicPrefix}${value.slug}`);

    return { ok: true, message: published ? "Saved and published." : value.status === "archived" ? "Saved as archived." : "Draft saved.", data: { id: savedId! } };
  });
}

export async function deleteCollectionItem(key: CollectionKey, id: string): Promise<ActionResult> {
  const cfg: CollectionConfig = COLLECTIONS[key];
  return withPermission("content.delete", async (ctx) => {
    const { data, error } = await ctx.supabase.from(cfg.table).delete().eq("id", id).select(`id, slug, status, ${cfg.nameField}`);
    if (error) dbError(error, cfg.label);
    const deleted = data?.[0] as Record<string, string> | undefined;
    if (!deleted) throw new ActionError("Item not found or you don't have permission to delete it.");
    await audit(ctx, `${cfg.resource}.delete`, cfg.resource, id, `Deleted ${cfg.label} "${deleted[cfg.nameField]}"`);
    if (deleted.status === "published") revalidatePublicSite(`${cfg.publicPrefix}${deleted.slug}`);
    return { ok: true, message: "Deleted." };
  });
}

export async function reorderCollection(key: CollectionKey, orderedIds: string[]): Promise<ActionResult> {
  const cfg: CollectionConfig = COLLECTIONS[key];
  return withPermission("content.publish", async (ctx) => {
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await ctx.supabase.from(cfg.table).update({ sort_order: (index + 1) * 10 }).eq("id", id);
      if (error) dbError(error, "order");
    }
    await audit(ctx, `${cfg.resource}.reorder`, cfg.resource, null, `Reordered ${orderedIds.length} ${cfg.label}s`);
    revalidatePublicSite();
    return { ok: true, message: "Order saved." };
  });
}
