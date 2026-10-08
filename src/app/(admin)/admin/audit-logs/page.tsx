import { AdminPageHeader, EmptyRow, Pagination, Table, td, th } from "@/components/admin/ui";
import { inputCls } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/session";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit Logs" };
const PAGE_SIZE = 50;
const TYPES = ["service", "portfolio_project", "product", "page", "lead", "media", "seo", "settings", "user", "session"];

export default async function AuditLogsPage({ searchParams }: PageProps<"/admin/audit-logs">) {
  const { supabase } = await requirePage("audit.view");
  const sp = await searchParams;
  const type = typeof sp.type === "string" && TYPES.includes(sp.type) ? sp.type : "";
  const page = Math.max(1, Number(sp.page) || 1);
  let q = supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, summary, created_at, profiles:actor_id(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (type) q = q.eq("resource_type", type);
  const { data, count } = await q;
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Audit Logs" description="An append-only record of administrative actions. Entries cannot be edited or deleted from the app." />
      <form method="GET" className="mb-4 flex gap-2">
        <label className="sr-only" htmlFor="type">
          Resource type
        </label>
        <select id="type" name="type" defaultValue={type} className={cn(inputCls, "h-10 w-56")}>
          <option value="">All resource types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" className="h-10">
          Filter
        </Button>
      </form>
      <Table caption="Audit log">
        <thead>
          <tr>
            <th className={th}>When</th>
            <th className={th}>Who</th>
            <th className={th}>Action</th>
            <th className={th}>Details</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).length === 0 ? (
            <EmptyRow colSpan={4}>No entries.</EmptyRow>
          ) : (
            (data ?? []).map((a) => {
              const p = a.profiles as unknown as { full_name: string | null; email: string } | null;
              return (
                <tr key={a.id}>
                  <td className={cn(td, "whitespace-nowrap")}>{formatDateTime(a.created_at)}</td>
                  <td className={td}>{p?.full_name || p?.email || "Deleted user"}</td>
                  <td className={td}>
                    <code className="text-xs text-indigo-200">{a.action}</code>
                  </td>
                  <td className={td}>{a.summary}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
      <Pagination page={page} pageCount={pageCount} makeHref={(p) => `/admin/audit-logs?${new URLSearchParams({ ...(type && { type }), page: String(p) })}`} />
    </>
  );
}
