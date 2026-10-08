import { Search } from "lucide-react";
import { AdminPageHeader, Pagination } from "@/components/admin/ui";
import { LeadsTable } from "@/components/admin/leads-table";
import { inputCls } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/types/content";

export const metadata = { title: "Leads" };
const PAGE_SIZE = 25;

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const { supabase } = await requirePage("leads.view");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = str("q").slice(0, 100);
  const status = (LEAD_STATUSES as readonly string[]).includes(str("status")) ? (str("status") as LeadStatus) : "";
  const service = str("service").slice(0, 120);
  const sort = str("sort") === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, Number(str("page")) || 1);

  let query = supabase
    .from("leads")
    .select("id, full_name, email, company_name, service_required, status, is_read, created_at, notification_status", { count: "exact" })
    .order("created_at", { ascending: sort === "oldest" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (service) query = query.eq("service_required", service);
  const term = q.replace(/[%_,()]/g, "").trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,company_name.ilike.%${term}%,project_description.ilike.%${term}%`);

  const [{ data, count, error }, { data: services }] = await Promise.all([query, supabase.from("leads").select("service_required").limit(1000)]);
  const serviceOptions = Array.from(new Set((services ?? []).map((s) => s.service_required))).sort();
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const makeHref = (p: number) => {
    const params = new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(service && { service }), ...(sort !== "newest" && { sort }), page: String(p) });
    return `/admin/leads?${params}`;
  };

  return (
    <>
      <AdminPageHeader title="Leads" description={`${count ?? 0} inquiries`} />
      <form method="GET" role="search" className="mb-4 grid gap-2 rounded-2xl border border-line bg-ink-900 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_200px_150px_auto]">
        <label className="relative">
          <span className="sr-only">Search leads</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Search name, email, company, description" className={cn(inputCls, "h-10 pl-9")} />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status} className={cn(inputCls, "h-10")}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Service</span>
          <select name="service" defaultValue={service} className={cn(inputCls, "h-10")}>
            <option value="">All services</option>
            {serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select name="sort" defaultValue={sort} className={cn(inputCls, "h-10")}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <Button type="submit" variant="secondary" className="h-10">
          Apply
        </Button>
      </form>
      {error ? <p role="alert" className="mb-4 text-sm text-red-300">Could not load leads.</p> : null}
      <LeadsTable
        rows={(data ?? []).map((r) => ({
          id: r.id,
          fullName: r.full_name,
          email: r.email,
          company: r.company_name,
          service: r.service_required,
          status: r.status,
          isRead: r.is_read,
          createdAt: r.created_at,
          notification: r.notification_status,
        }))}
      />
      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
    </>
  );
}
