import type { Metadata } from "next";
import { PageHero } from "@/components/website/page-hero";
import { ProductGrid } from "@/components/website/product-grid";
import { TechExpertise } from "@/components/website/capabilities";
import { SectionHeader } from "@/components/ui/section-header";
import { CtaPanel } from "@/components/home/sections";
import { listProducts, listServices } from "@/lib/content/repository";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

/** Service pages that describe how our own products are built (shown when no product is published yet). */
const PRODUCT_PLATFORM_SERVICES = ["ios-app-development", "android-app-development", "flutter-app-development", "desktop-app-development", "ai-integration"];

export async function generateMetadata(): Promise<Metadata> {
  const products = await listProducts();
  return buildMetadata({
    path: "/products",
    title: "Software Products & Apps",
    description:
      products.length > 0
        ? `Apps and software products built and maintained by ParitySoft AI: ${products
            .slice(0, 3)
            .map((p) => p.name)
            .join(", ")}${products.length > 3 ? " and more" : ""}.`
        : "ParitySoft AI designs, builds and maintains its own apps for iOS, Android, macOS and Windows, using the same engineering we bring to client projects.",
  });
}

export default async function ProductsPage() {
  const [products, services] = await Promise.all([listProducts(), listServices()]);
  const hasProducts = products.length > 0;
  const platformServices = services.filter((s) => PRODUCT_PLATFORM_SERVICES.includes(s.slug));

  return (
    <>
      <PageHero
        crumbs={[{ label: "Products", href: "/products" }]}
        heading={hasProducts ? "Our software products" : "Software products by ParitySoft AI"}
        intro={
          hasProducts
            ? "Beyond client development, we design, build and maintain our own apps. Each product links to its official store or website."
            : "Alongside client work, we design, build and maintain our own apps for iOS, Android, macOS and Windows. Products are listed here, with links to their official stores, once they are publicly available."
        }
      />

      {hasProducts ? (
        <section aria-label="Products" className="container-site pb-16 sm:pb-20">
          <ProductGrid products={products} />
        </section>
      ) : (
        <section aria-labelledby="product-engineering" className="container-site pb-16 sm:pb-20">
          <SectionHeader
            id="product-engineering"
            heading="How we build our own products"
            description="The same platforms, tools and release practices we use for client projects — from native Apple and Android apps to cross-platform, desktop and AI features."
          />
          <div className="mt-10">
            <TechExpertise services={platformServices.length > 0 ? platformServices : services} />
          </div>
        </section>
      )}

      <div className="container-site pb-20 sm:pb-24">
        <CtaPanel
          heading="Planning a product of your own?"
          description="We help founders and teams take apps from idea to App Store, Google Play and Microsoft Store."
          primary={{ label: "Start a Project", href: "/contact" }}
          secondary={{ label: "Explore our services", href: "/services" }}
        />
      </div>
    </>
  );
}
