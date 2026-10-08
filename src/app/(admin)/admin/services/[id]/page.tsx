import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ServiceEditor } from "@/components/admin/editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { mapService } from "@/lib/content/mappers";
import { serviceToForm } from "@/lib/content/forms";

export const metadata = { title: "Edit service" };

export default async function EditPage({ params }: PageProps<"/admin/services/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requirePage("content.edit");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = mapService(data);
  return (
    <>
      <AdminPageHeader title={item.title} back={{ href: "/admin/services", label: "Back" }} />
      <ServiceEditor key={item.updatedAt} id={item.id} initial={serviceToForm(item)} updatedAt={item.updatedAt} canPublish={can(user.role, "content.publish")} canDelete={can(user.role, "content.delete")} />
    </>
  );
}
