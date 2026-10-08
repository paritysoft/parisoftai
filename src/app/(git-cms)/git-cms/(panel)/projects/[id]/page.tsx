import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProjectEditor } from "@/components/admin/editors";
import { GitBackendProvider } from "@/components/cms/git-backend";
import { projectToForm } from "@/lib/content/forms";
import { loadAdminItems, publishStatus } from "@/lib/cms/data";
import { ID_PATTERN, type StoredProject } from "@/lib/content/file-format";

export const metadata = { title: "Edit project" };

export default async function CmsEditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) notFound();
  const { items } = await loadAdminItems("projects");
  const item = items.find((i) => i.id === id) as StoredProject | undefined;
  if (!item) notFound();
  const { createdAt: _c, ...entity } = item;
  void _c;
  return (
    <>
      <AdminPageHeader title={item.title} back={{ href: "/admin/projects", label: "Projects" }} />
      <GitBackendProvider collection="projects" publishNote={publishStatus().note}>
        <ProjectEditor key={item.updatedAt} id={item.id} listHref="/admin/projects" initial={projectToForm(entity)} updatedAt={item.updatedAt} canPublish canDelete />
      </GitBackendProvider>
    </>
  );
}
