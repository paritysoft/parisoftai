import { AdminPageHeader } from "@/components/admin/ui";
import { ServiceEditor } from "@/components/admin/editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { emptyService } from "@/lib/content/forms";

export const metadata = { title: "New service" };

export default async function NewPage() {
  const { user } = await requirePage("content.edit");
  return (
    <>
      <AdminPageHeader title="New service" back={{ href: "/admin/services", label: "Back" }} />
      <ServiceEditor id={null} initial={emptyService} canPublish={can(user.role, "content.publish")} canDelete={false} />
    </>
  );
}
