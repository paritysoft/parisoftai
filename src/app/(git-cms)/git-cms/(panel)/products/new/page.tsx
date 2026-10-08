import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/editors";
import { GitBackendProvider } from "@/components/cms/git-backend";
import { emptyProduct } from "@/lib/content/forms";
import { publishStatus } from "@/lib/cms/data";

export const metadata = { title: "New product" };

export default function CmsNewProductPage() {
  return (
    <>
      <AdminPageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      <GitBackendProvider collection="products" publishNote={publishStatus().note}>
        <ProductEditor id={null} initial={emptyProduct} listHref="/admin/products" canPublish canDelete={false} />
      </GitBackendProvider>
    </>
  );
}
