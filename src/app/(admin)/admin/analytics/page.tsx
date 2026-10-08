import { ExternalLink } from "lucide-react";
import { AdminPageHeader, Card, StatCard } from "@/components/admin/ui";
import { BarChart, HBarList } from "@/components/admin/charts";
import { requirePage } from "@/lib/auth/session";
import { leadStats } from "@/lib/leads/stats";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const { supabase } = await requirePage("analytics.view");
  const stats = await leadStats(supabase, 12);
  const dashboardUrl = serverEnv.analyticsDashboardUrl;

  return (
    <>
      <AdminPageHeader title="Analytics" description="First-party inquiry data from the website database, plus a link to Vercel Web Analytics for traffic." />

      <Card title="Website traffic (Vercel Web Analytics)">
        <div className="space-y-3 text-sm text-fg-2">
          <p>
            Page views, visitors, top pages, referrers and the <code className="text-indigo-200">inquiry_submitted</code> conversion event are collected by Vercel Web Analytics. This admin does not pull that data in or estimate
            it — view it in the Vercel dashboard. (Exporting raw events into your own database is possible through Vercel&apos;s official drains on
            supported plans, if you need it later.)
          </p>
          {dashboardUrl ? (
            <a href={dashboardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-indigo-200 hover:text-white">
              Open Vercel Analytics <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          ) : (
            <p className="rounded-lg border border-line bg-ink-950/50 p-3 text-fg-3">
              Not linked yet. Enable Web Analytics in your Vercel project, then set <code>ANALYTICS_DASHBOARD_URL</code> to the project&apos;s analytics page to show a shortcut here.
            </p>
          )}
        </div>
      </Card>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-fg">Inquiries</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total inquiries" value={stats.total} />
        <StatCard label="New" value={stats.fresh} />
        <StatCard label="Unread" value={stats.unread} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Inquiries per week" description="Last 12 weeks">
          <BarChart data={stats.weekly} label="Inquiries per week" />
        </Card>
        <Card title="By status">
          <HBarList data={stats.byStatus} label="Inquiries by status" />
        </Card>
        <Card title="By requested service" description="Last 12 weeks">
          <HBarList data={stats.byService} label="Inquiries by requested service" />
        </Card>
      </div>
    </>
  );
}
