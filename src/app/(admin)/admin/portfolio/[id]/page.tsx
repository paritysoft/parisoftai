import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProjectEditor } from "@/components/admin/editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { mapProject } from "@/lib/content/mappers";
import { projectToForm } from "@/lib/content/forms";

export const metadata = { title: "Edit project" };

export default async function EditPage({ params }: PageProps<"/admin/portfolio/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requirePage("content.edit");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabase.from("portfolio_projects").select("*, portfolio_images(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = mapProject(data);
  return (
    <>
      <AdminPageHeader title={item.title} back={{ href: "/admin/portfolio", label: "Back" }} />
      <ProjectEditor key={item.updatedAt} id={item.id} initial={projectToForm(item)} updatedAt={item.updatedAt} canPublish={can(user.role, "content.publish")} canDelete={can(user.role, "content.delete")} />
    </>
  );
}
