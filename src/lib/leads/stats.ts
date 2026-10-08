import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/types/content";

/** First-party inquiry statistics from Supabase (not web analytics). */
export async function leadStats(supabase: SupabaseClient, weeks = 12) {
  const since = new Date(Date.now() - weeks * 7 * 86_400_000);
  const [{ data: recent }, total, unread, fresh, ...statusCounts] = await Promise.all([
    supabase.from("leads").select("created_at, service_required").gte("created_at", since.toISOString()).limit(5000),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ...LEAD_STATUSES.map((s) => supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);

  const start = new Date(since);
  start.setUTCHours(0, 0, 0, 0);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const d = new Date(start.getTime() + i * 7 * 86_400_000);
    return { start: d, label: d.toLocaleDateString("en", { month: "short", day: "numeric" }), value: 0 };
  });
  const byService = new Map<string, number>();
  for (const r of recent ?? []) {
    const t = new Date(r.created_at).getTime();
    const idx = Math.min(weeks - 1, Math.floor((t - start.getTime()) / (7 * 86_400_000)));
    if (idx >= 0) buckets[idx]!.value++;
    byService.set(r.service_required, (byService.get(r.service_required) ?? 0) + 1);
  }

  return {
    total: total.count ?? 0,
    unread: unread.count ?? 0,
    fresh: fresh.count ?? 0,
    weekly: buckets.map(({ label, value }) => ({ label: `Week of ${label}`, value })),
    byStatus: LEAD_STATUSES.map((s, i) => ({ label: LEAD_STATUS_LABELS[s], value: statusCounts[i]?.count ?? 0 })),
    byService: Array.from(byService.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
  };
}
