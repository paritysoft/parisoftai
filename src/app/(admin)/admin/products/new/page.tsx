import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { emptyProduct } from "@/lib/content/forms";

export const metadata = { title: "New product" };

export default async function NewPage() {
  const { user } = await requirePage("content.edit");
  return (
    <>
      <AdminPageHeader title="New product" back={{ href: "/admin/products", label: "Back" }} />
      <ProductEditor id={null} initial={emptyProduct} canPublish={can(user.role, "content.publish")} canDelete={false} />
    </>
  );
}
