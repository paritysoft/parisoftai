import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/editors";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { mapProduct } from "@/lib/content/mappers";
import { productToForm } from "@/lib/content/forms";

export const metadata = { title: "Edit product" };

export default async function EditPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requirePage("content.edit");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await supabase.from("products").select("*, product_images(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const item = mapProduct(data);
  return (
    <>
      <AdminPageHeader title={item.name} back={{ href: "/admin/products", label: "Back" }} />
      <ProductEditor key={item.updatedAt} id={item.id} initial={productToForm(item)} updatedAt={item.updatedAt} canPublish={can(user.role, "content.publish")} canDelete={can(user.role, "content.delete")} />
    </>
  );
}
