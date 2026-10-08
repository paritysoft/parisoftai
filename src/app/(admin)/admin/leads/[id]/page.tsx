import { notFound } from "next/navigation";
import { AdminPageHeader, Card, LeadStatusBadge } from "@/components/admin/ui";
import { LeadControls, LeadNotes } from "@/components/admin/lead-detail";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({ params }: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requirePage("leads.view");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();
  if (!lead.is_read) await supabase.from("leads").update({ is_read: true }).eq("id", id);

  const [{ data: notes }, { data: staff }] = await Promise.all([
    supabase.from("lead_notes").select("id, body, created_at, profiles:author_id(full_name, email)").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["admin", "super_admin"]).eq("is_active", true),
  ]);

  const details: [string, string | null][] = [
    ["Email", lead.email],
    ["Company", lead.company_name],
    ["Service", lead.service_required],
    ["Budget", lead.estimated_budget],
    ["Timeline", lead.preferred_timeline],
    ["Consent given", lead.consent_given ? "Yes" : "No"],
    ["Submitted", formatDateTime(lead.created_at)],
  ];

  return (
    <>
      <AdminPageHeader title={lead.full_name} back={{ href: "/admin/leads", label: "Leads" }} actions={<LeadStatusBadge status={lead.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Inquiry">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-fg-3">{k}</dt>
                    <dd className="break-words text-fg">{v}</dd>
                  </div>
                ))}
            </dl>
            <h3 className="mt-6 text-sm font-semibold text-fg">Project description</h3>
            {/* Rendered as plain text — never as HTML */}
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg-2">{lead.project_description}</p>
          </Card>
          <LeadNotes
            id={lead.id}
            notes={(notes ?? []).map((n) => {
              const a = n.profiles as unknown as { full_name: string | null; email: string } | null;
              return { id: n.id, body: n.body, createdAt: n.created_at, author: a?.full_name || a?.email || "Former user" };
            })}
          />
        </div>
        <LeadControls
          id={lead.id}
          email={lead.email}
          status={lead.status}
          assignedTo={lead.assigned_to}
          staff={(staff ?? []).map((s) => ({ id: s.id, name: s.full_name || s.email }))}
          notification={{ status: lead.notification_status, attempts: lead.notification_attempts, error: lead.notification_error }}
          canDelete={can(user.role, "leads.delete")}
        />
      </div>
    </>
  );
}
