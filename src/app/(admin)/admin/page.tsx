import Link from "next/link";
import { ExternalLink, FilePen, ImagePlus, Inbox, PackagePlus, Plus } from "lucide-react";
import { AdminPageHeader, Card, Denied, LeadStatusBadge, StatCard, StatusBadge } from "@/components/admin/ui";
import { BarChart, HBarList } from "@/components/admin/charts";
import { buttonClasses } from "@/components/ui/button";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { leadStats } from "@/lib/leads/stats";
import { serverEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/utils";
import type { ContentStatus, LeadStatus } from "@/types/content";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const { supabase, user } = await requirePage();
  const sp = await searchParams;
  const showLeads = can(user.role, "leads.view");
  const showAudit = can(user.role, "audit.view");

  const [projects, products, services, recentContent, stats, recentLeads, activity, homePage] = await Promise.all([
    supabase.from("portfolio_projects").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("status", "published"),
    Promise.all([
      supabase.from("services").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("portfolio_projects").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("products").select("id, name, status, updated_at").order("updated_at", { ascending: false }).limit(5),
    ]),
    showLeads ? leadStats(supabase) : Promise.resolve(null),
    showLeads ? supabase.from("leads").select("id, full_name, service_required, status, created_at").order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
    showAudit ? supabase.from("audit_logs").select("id, action, summary, created_at, profiles:actor_id(full_name, email)").order("created_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
    supabase.from("pages").select("id").eq("key", "home").maybeSingle(),
  ]);

  const [svc, prj, prd] = recentContent;
  const content = [
    ...(svc.data ?? []).map((r) => ({ id: r.id, name: r.title, status: r.status as ContentStatus, updatedAt: r.updated_at, href: `/admin/services/${r.id}`, kind: "Service" })),
    ...(prj.data ?? []).map((r) => ({ id: r.id, name: r.title, status: r.status as ContentStatus, updatedAt: r.updated_at, href: `/admin/portfolio/${r.id}`, kind: "Project" })),
    ...(prd.data ?? []).map((r) => ({ id: r.id, name: r.name, status: r.status as ContentStatus, updatedAt: r.updated_at, href: `/admin/products/${r.id}`, kind: "Product" })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <>
      {sp.denied ? <Denied /> : null}
      <AdminPageHeader title={`Welcome${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`} description="Overview of website content and inquiries." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Portfolio projects" value={projects.count ?? 0} href="/admin/portfolio" />
        <StatCard label="Published products" value={products.count ?? 0} href="/admin/products" />
        <StatCard label="Published services" value={services.count ?? 0} href="/admin/services" />
        {stats ? (
          <>
            <StatCard label="New inquiries" value={stats.fresh} hint="Status: New" href="/admin/leads?status=new" />
            <StatCard label="Unread inquiries" value={stats.unread} href="/admin/leads" />
            <StatCard label="Total inquiries" value={stats.total} href="/admin/leads" />
          </>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Quick actions">
        <Link href="/admin/portfolio/new" className={buttonClasses("secondary", "sm")}>
          <Plus className="size-4" aria-hidden="true" /> Add project
        </Link>
        <Link href="/admin/products/new" className={buttonClasses("secondary", "sm")}>
          <PackagePlus className="size-4" aria-hidden="true" /> Add product
        </Link>
        {homePage.data ? (
          <Link href={`/admin/pages/${homePage.data.id}`} className={buttonClasses("secondary", "sm")}>
            <FilePen className="size-4" aria-hidden="true" /> Edit homepage
          </Link>
        ) : null}
        {showLeads ? (
          <Link href="/admin/leads" className={buttonClasses("secondary", "sm")}>
            <Inbox className="size-4" aria-hidden="true" /> View leads
          </Link>
        ) : null}
        <Link href="/admin/media" className={buttonClasses("secondary", "sm")}>
          <ImagePlus className="size-4" aria-hidden="true" /> Upload media
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary", "sm")}>
          <ExternalLink className="size-4" aria-hidden="true" /> View website
        </a>
      </div>

      {stats ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card title="Inquiries per week" description="Last 12 weeks, from the website contact form.">
            <BarChart data={stats.weekly} label="Inquiries per week, last 12 weeks" />
          </Card>
          <Card title="Inquiries by status">
            <HBarList data={stats.byStatus} label="Inquiries by status" />
          </Card>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Recently updated content">
          {content.length === 0 ? (
            <p className="text-sm text-fg-3">No content yet.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {content.map((c) => (
                <li key={`${c.kind}-${c.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <Link href={c.href} className="font-medium text-fg hover:text-indigo-200">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-fg-3">
                      {c.kind} · {formatDateTime(c.updatedAt)}
                    </span>
                  </span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        {showLeads ? (
          <Card title="Recent inquiries">
            {(recentLeads.data ?? []).length === 0 ? (
              <p className="text-sm text-fg-3">No inquiries yet. They appear here when someone submits the contact form.</p>
            ) : (
              <ul className="divide-y divide-line/60">
                {(recentLeads.data ?? []).map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <Link href={`/admin/leads/${l.id}`} className="font-medium text-fg hover:text-indigo-200">
                        {l.full_name}
                      </Link>
                      <span className="block truncate text-xs text-fg-3">
                        {l.service_required} · {formatDateTime(l.created_at)}
                      </span>
                    </span>
                    <LeadStatusBadge status={l.status as LeadStatus} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
        {showAudit ? (
          <Card title="Recent admin activity" actions={<Link href="/admin/audit-logs" className="text-xs text-indigo-200 hover:text-white">View all</Link>}>
            <ul className="divide-y divide-line/60">
              {(activity.data ?? []).map((a) => {
                const p = a.profiles as unknown as { full_name: string | null; email: string } | null;
                return (
                  <li key={a.id} className="py-2.5 text-sm">
                    <span className="text-fg-2">{a.summary ?? a.action}</span>
                    <span className="block text-xs text-fg-3">
                      {p?.full_name || p?.email || "System"} · {formatDateTime(a.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}
        {showLeads ? (
          <Card title="Website traffic">
            <p className="text-sm text-fg-3">
              Visitor numbers come from Vercel Web Analytics and are not copied into this dashboard.{" "}
              {serverEnv.analyticsDashboardUrl ? (
                <a href={serverEnv.analyticsDashboardUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-200 hover:text-white">
                  Open analytics
                </a>
              ) : (
                <Link href="/admin/analytics" className="text-indigo-200 hover:text-white">
                  See analytics setup
                </Link>
              )}
            </p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
