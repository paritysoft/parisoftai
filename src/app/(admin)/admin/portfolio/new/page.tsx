import { AdminPageHeader } from "@/components/admin/ui";
import { ProjectEditor } from "@/components/admin/editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { emptyProject } from "@/lib/content/forms";

export const metadata = { title: "New project" };

export default async function NewPage() {
  const { user } = await requirePage("content.edit");
  return (
    <>
      <AdminPageHeader title="New project" back={{ href: "/admin/portfolio", label: "Back" }} />
      <ProjectEditor id={null} initial={emptyProject} canPublish={can(user.role, "content.publish")} canDelete={false} />
    </>
  );
}
