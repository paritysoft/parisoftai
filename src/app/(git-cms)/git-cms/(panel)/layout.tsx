import { CmsShell } from "@/components/cms/cms-shell";
import { requireCmsPage } from "@/lib/cms/session";
import { publishStatus } from "@/lib/cms/data";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCmsPage();
  const status = publishStatus();
  const banner =
    status.target === "github" ? null : (
      <div role="status" className={status.target === "none" ? "border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 lg:px-8" : "border-b border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm text-sky-100 lg:px-8"}>
        {status.note}
      </div>
    );
  return (
    <CmsShell email={session.email} banner={banner}>
      {children}
    </CmsShell>
  );
}
