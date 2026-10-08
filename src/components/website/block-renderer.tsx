import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";
import { buttonClasses } from "@/components/ui/button";
import { Faq } from "@/components/website/faq";
import { Reveal } from "@/components/motion/reveal";
import { safeHref } from "@/lib/utils";
import type { Block } from "@/types/content";

/** Renders structured page blocks. No block type can inject raw HTML or scripts. */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-12">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return block.level === 3 ? (
        <h3 className="text-xl font-semibold text-fg">{block.text}</h3>
      ) : (
        <h2 className="text-2xl font-bold text-fg sm:text-3xl">{block.text}</h2>
      );
    case "paragraph":
      return <p className="max-w-[72ch] text-[1.0625rem] leading-relaxed text-fg-2">{block.text}</p>;
    case "richText":
      return <Markdown>{block.markdown}</Markdown>;
    case "image": {
      const src = safeHref(block.url);
      if (!src) return null;
      return (
        <figure>
          <div className="surface relative aspect-[16/9] overflow-hidden">
            <SmartImage src={src} alt={block.alt} sizes="(min-width: 1024px) 960px, 100vw" />
          </div>
          {block.caption ? <figcaption className="mt-3 text-sm text-fg-3">{block.caption}</figcaption> : null}
        </figure>
      );
    }
    case "cta": {
      const href = safeHref(block.href) ?? "/contact";
      return (
        <Reveal className="surface flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-fg">{block.heading}</h2>
            {block.description ? <p className="mt-2 text-fg-3">{block.description}</p> : null}
          </div>
          <Link href={href} className={buttonClasses("primary", "lg")}>
            {block.label} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      );
    }
    case "featureGrid":
      return (
        <div>
          {block.heading ? <h2 className="text-2xl font-bold text-fg sm:text-3xl">{block.heading}</h2> : null}
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {block.items.map((item, i) => (
              <Reveal as="li" key={`${item.title}-${i}`} className="surface p-6">
                <h3 className="text-lg font-semibold text-fg">{item.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-3">{item.description}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      );
    case "stats": {
      const items = block.items.filter((s) => s.verified);
      if (items.length === 0) return null;
      return (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <div key={`${s.label}-${i}`} className="surface p-6">
              <dt className="text-sm text-fg-3">{s.label}</dt>
              <dd className="mt-1 font-display text-4xl font-extrabold text-fg">
                {s.value}
                {s.suffix}
              </dd>
              {s.note ? <dd className="mt-1 text-xs text-fg-3">{s.note}</dd> : null}
            </div>
          ))}
        </dl>
      );
    }
    case "faq":
      return <Faq items={block.items} heading={block.heading} />;
    case "testimonial": {
      const t = block.testimonial;
      if (!t.approved || !t.quote || !t.name) return null;
      return (
        <figure className="surface p-8">
          <Quote className="size-6 text-accent" aria-hidden="true" />
          <blockquote className="mt-4 text-xl leading-relaxed text-fg">“{t.quote}”</blockquote>
          <figcaption className="mt-5 text-sm text-fg-3">
            <span className="font-semibold text-fg">{t.name}</span>
            {t.role || t.company ? `, ${[t.role, t.company].filter(Boolean).join(", ")}` : null}
          </figcaption>
        </figure>
      );
    }
    default:
      return null;
  }
}
