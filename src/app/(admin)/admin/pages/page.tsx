import Link from "next/link";
import { AdminPageHeader, EmptyRow, StatusBadge, Table, td, th } from "@/components/admin/ui";
import { requirePage } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Pages" };

const PATHS: Record<string, string> = { home: "/", about: "/about", contact: "/contact", privacy: "/privacy", terms: "/terms" };

export default async function AdminPagesList() {
  const { supabase } = await requirePage("content.edit");
  const [{ data: pages }, { data: revs }] = await Promise.all([
    supabase.from("pages").select("id, key, title, status, published_at").order("key"),
    supabase.from("page_revisions").select("page_id, kind, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const latest = new Map<string, { kind: string; created_at: string }>();
  for (const r of revs ?? []) if (!latest.has(r.page_id)) latest.set(r.page_id, r);

  return (
    <>
      <AdminPageHeader title="Pages" description="Homepage sections, About, Contact and legal pages." />
      <Table caption="Pages">
        <thead>
          <tr>
            <th className={th}>Page</th>
            <th className={th}>URL</th>
            <th className={th}>Status</th>
            <th className={th}>Last published</th>
          </tr>
        </thead>
        <tbody>
          {(pages ?? []).length === 0 ? (
            <EmptyRow colSpan={4}>No pages found. Run the database seed (supabase/seed.sql).</EmptyRow>
          ) : (
            (pages ?? []).map((p) => {
              const l = latest.get(p.id);
              const pendingDraft = l?.kind === "draft" && (!p.published_at || new Date(l.created_at) > new Date(p.published_at));
              return (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className={td}>
                    <Link href={`/admin/pages/${p.id}`} className="font-medium text-fg hover:text-indigo-200">
                      {p.title}
                    </Link>
                  </td>
                  <td className={td}>{PATHS[p.key] ?? `/${p.key}`}</td>
                  <td className={td}>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      {pendingDraft ? <span className="text-xs text-amber-200">Unpublished draft</span> : null}
                    </span>
                  </td>
                  <td className={td}>{formatDateTime(p.published_at)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </>
  );
}
