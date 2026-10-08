import { AdminPageHeader } from "@/components/admin/ui";
import { ProjectEditor } from "@/components/admin/editors";
import { GitBackendProvider } from "@/components/cms/git-backend";
import { emptyProject } from "@/lib/content/forms";
import { publishStatus } from "@/lib/cms/data";

export const metadata = { title: "New project" };

export default function CmsNewProjectPage() {
  return (
    <>
      <AdminPageHeader title="New project" back={{ href: "/admin/projects", label: "Projects" }} />
      <GitBackendProvider collection="projects" publishNote={publishStatus().note}>
        <ProjectEditor id={null} initial={emptyProject} listHref="/admin/projects" canPublish canDelete={false} />
      </GitBackendProvider>
    </>
  );
}
