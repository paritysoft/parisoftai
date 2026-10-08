import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { toCsv } from "@/lib/leads/csv";
import { audit } from "@/lib/audit";

/** Exports selected leads (or all matching leads when no ids are given) as CSV. Admins only. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (session.kind !== "staff" || !can(session.user.role, "leads.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 1000);
  let q = session.supabase
    .from("leads")
    .select("created_at, full_name, email, company_name, service_required, estimated_budget, preferred_timeline, status, project_description")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (ids.length) q = q.in("id", ids);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  const csv = toCsv(
    ["Submitted", "Name", "Email", "Company", "Service", "Budget", "Timeline", "Status", "Description"],
    (data ?? []).map((r) => [r.created_at, r.full_name, r.email, r.company_name, r.service_required, r.estimated_budget, r.preferred_timeline, r.status, r.project_description]),
  );
  await audit({ user: session.user, supabase: session.supabase }, "lead.export", "lead", null, `Exported ${data?.length ?? 0} leads`);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
