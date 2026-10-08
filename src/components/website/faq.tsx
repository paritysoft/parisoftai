import { Plus } from "lucide-react";
import { JsonLd } from "@/components/website/json-ld";
import type { FAQItem } from "@/types/content";

/** Accessible FAQ built on native <details>, works without JavaScript. */
export function Faq({ items, heading = "Frequently asked questions", withSchema = true }: { items: FAQItem[]; heading?: string; withSchema?: boolean }) {
  const valid = items.filter((i) => i.question && i.answer);
  if (valid.length === 0) return null;
  return (
    <div>
      {heading ? <h2 className="text-2xl font-bold text-fg sm:text-3xl">{heading}</h2> : null}
      <div className="mt-8 divide-y divide-line border-y border-line">
        {valid.map((item) => (
          <details key={item.question} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left font-display text-[1.0625rem] font-semibold text-fg marker:hidden [&::-webkit-details-marker]:hidden">
              {item.question}
              <Plus className="size-5 shrink-0 text-fg-3 transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
            </summary>
            <p className="max-w-3xl pb-5 leading-relaxed text-fg-3">{item.answer}</p>
          </details>
        ))}
      </div>
      {withSchema ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: valid.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })),
          }}
        />
      ) : null}
    </div>
  );
}
