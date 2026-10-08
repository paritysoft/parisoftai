import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { GenericPageEditor, HomePageEditor } from "@/components/admin/page-editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { normalizeGenericPage, normalizeHome } from "@/lib/content/normalize";
import { pageSeeds } from "@/content/pages";
import type { GenericPageContent, PageKey } from "@/types/content";

export const metadata = { title: "Edit page" };

const PATHS: Record<string, string> = { home: "/", about: "/about", contact: "/contact", privacy: "/privacy", terms: "/terms" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requirePage("content.edit");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: page } = await supabase.from("pages").select("id, key, title, published_content, published_at").eq("id", id).maybeSingle();
  if (!page) notFound();
  const { data: revs } = await supabase
    .from("page_revisions")
    .select("id, kind, content, created_at, profiles:created_by(full_name, email)")
    .eq("page_id", id)
    .order("created_at", { ascending: false })
    .limit(15);

  const latest = revs?.[0];
  const hasUnpublishedDraft = Boolean(latest && latest.kind === "draft" && (!page.published_at || new Date(latest.created_at) > new Date(page.published_at)));
  const source = hasUnpublishedDraft ? latest!.content : page.published_content;
  const revisions = (revs ?? []).map((r) => {
    const author = r.profiles as unknown as { full_name: string | null; email: string } | null;
    return { id: r.id, kind: r.kind as "draft" | "published", createdAt: r.created_at, content: r.content, author: author?.full_name || author?.email || null };
  });
  const frame = {
    pageId: page.id,
    path: PATHS[page.key] ?? "/",
    canPublish: can(user.role, "content.publish"),
    hasUnpublishedDraft,
    publishedAt: page.published_at,
    revisions,
  };

  return (
    <>
      <AdminPageHeader title={page.title} description={`Editing ${PATHS[page.key] ?? page.key}`} back={{ href: "/admin/pages", label: "Pages" }} />
      {page.key === "home" ? (
        <HomePageEditor key={latest?.id ?? "p"} initial={normalizeHome(source)} {...frame} />
      ) : (
        <GenericPageEditor
          key={latest?.id ?? "p"}
          pageKey={page.key}
          initial={normalizeGenericPage(source, (pageSeeds[page.key as PageKey]?.content ?? pageSeeds.about.content) as GenericPageContent)}
          {...frame}
        />
      )}
    </>
  );
}
