import { PageHero } from "@/components/website/page-hero";
import { BlockRenderer } from "@/components/website/block-renderer";
import { Notice } from "@/components/website/notice";
import type { GenericPageContent } from "@/types/content";

export function GenericPage({ content, path, label }: { content: GenericPageContent; path: string; label: string }) {
  return (
    <>
      <PageHero crumbs={[{ label, href: path }]} heading={content.heading} intro={content.intro} />
      <div className="container-site space-y-12 pb-20 sm:pb-24">
        {content.notice ? <Notice>{content.notice}</Notice> : null}
        {(content.mission || content.vision) && (
          <div className="grid gap-4 md:grid-cols-2">
            {content.mission ? (
              <section className="surface p-8" aria-labelledby="mission">
                <h2 id="mission" className="text-sm font-semibold text-glow">Our mission</h2>
                <p className="mt-3 font-display text-xl font-semibold leading-snug text-fg sm:text-2xl">{content.mission}</p>
              </section>
            ) : null}
            {content.vision ? (
              <section className="surface p-8" aria-labelledby="vision">
                <h2 id="vision" className="text-sm font-semibold text-glow">Our vision</h2>
                <p className="mt-3 font-display text-xl font-semibold leading-snug text-fg sm:text-2xl">{content.vision}</p>
              </section>
            ) : null}
          </div>
        )}
        <BlockRenderer blocks={content.blocks} />
      </div>
    </>
  );
}
