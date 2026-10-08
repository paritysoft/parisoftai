import { AdminPageHeader } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { listMediaAction } from "@/actions/media";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";

export const metadata = { title: "Media Library" };

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  const { user } = await requirePage("media.upload");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const res = await listMediaAction(q, 200);
  return (
    <>
      <AdminPageHeader title="Media Library" description="Images stored in Supabase Storage." />
      {!res.ok ? <p role="alert" className="mb-4 text-sm text-red-300">{res.error}</p> : null}
      <MediaLibrary key={q} initial={res.ok ? res.data ?? [] : []} canDelete={can(user.role, "media.delete")} query={q} />
    </>
  );
}
