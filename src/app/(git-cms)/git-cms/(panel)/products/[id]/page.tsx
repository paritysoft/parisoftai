import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/editors";
import { GitBackendProvider } from "@/components/cms/git-backend";
import { productToForm } from "@/lib/content/forms";
import { loadAdminItems, publishStatus } from "@/lib/cms/data";
import { ID_PATTERN, type StoredProduct } from "@/lib/content/file-format";

export const metadata = { title: "Edit product" };

export default async function CmsEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) notFound();
  const { items } = await loadAdminItems("products");
  const item = items.find((i) => i.id === id) as StoredProduct | undefined;
  if (!item) notFound();
  const { createdAt: _c, ...entity } = item;
  void _c;
  return (
    <>
      <AdminPageHeader title={item.name} back={{ href: "/admin/products", label: "Products" }} />
      <GitBackendProvider collection="products" publishNote={publishStatus().note}>
        <ProductEditor key={item.updatedAt} id={item.id} listHref="/admin/products" initial={productToForm(entity)} updatedAt={item.updatedAt} canPublish canDelete />
      </GitBackendProvider>
    </>
  );
}
