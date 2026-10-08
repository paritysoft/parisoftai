"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/admin/ui";
import { PageEditorFrame, type Revision } from "@/components/admin/page-editor-frame";
import { FaqEditor, MarkdownField, SelectInput, TextArea, TextInput, TitledListEditor, Toggle, inputCls, useDirty } from "@/components/admin/form-controls";
import { MediaField } from "@/components/admin/media";
import { Button } from "@/components/ui/button";
import { normalizeGenericPage, normalizeHome } from "@/lib/content/normalize";
import { cn } from "@/lib/utils";
import type { Block, BlockType, CtaLink, GenericPageContent, HomeContent, HomeSection, StatItem, Testimonial } from "@/types/content";

interface FrameProps {
  pageId: string;
  path: string;
  canPublish: boolean;
  hasUnpublishedDraft: boolean;
  publishedAt: string | null;
  revisions: Revision[];
}

const SECTION_LABELS: Record<HomeSection["key"], string> = {
  stats: "Statistics",
  services: "Services",
  work: "Featured work",
  products: "Our products",
  why: "Why choose us",
  process: "Development process",
  proof: "Testimonials / highlights",
  cta: "Final call to action",
};

function CtaFields({ label, value, onChange }: { label: string; value: CtaLink; onChange: (v: CtaLink) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextInput label={`${label} label`} value={value.label} onChange={(t) => onChange({ ...value, label: t })} />
      <TextInput label={`${label} link`} value={value.href} onChange={(t) => onChange({ ...value, href: t })} hint="e.g. /contact" />
    </div>
  );
}

function StatsEditor({ value, onChange }: { value: StatItem[]; onChange: (v: StatItem[]) => void }) {
  const update = (i: number, patch: Partial<StatItem>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">Statistics</legend>
      <p className="mb-3 text-xs text-fg-3">Only statistics marked as verified are shown publicly. Label founder-level experience clearly.</p>
      <ul className="space-y-3">
        {value.map((s, i) => (
          <li key={i} className="rounded-xl border border-line bg-ink-950/50 p-3">
            <div className="grid gap-3 sm:grid-cols-[100px_80px_1fr]">
              <TextInput label="Value" type="number" value={String(s.value)} onChange={(t) => update(i, { value: Number(t) || 0 })} />
              <TextInput label="Suffix" value={s.suffix} onChange={(t) => update(i, { suffix: t })} placeholder="+, K" />
              <TextInput label="Label" value={s.label} onChange={(t) => update(i, { label: t })} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <TextInput label="Context note" value={s.note} onChange={(t) => update(i, { note: t })} placeholder="e.g. Founder's experience" />
              <div className="flex items-center gap-3 pb-1">
                <Toggle label="Verified" checked={s.verified} onChange={(b) => update(i, { verified: b })} />
                <Button variant="ghost" size="sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove statistic ${i + 1}`}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...value, { value: 0, suffix: "", label: "", note: "", verified: false }])}>
        <Plus className="size-4" aria-hidden="true" /> Add statistic
      </Button>
    </fieldset>
  );
}

function TestimonialFields({ value, onChange }: { value: Testimonial; onChange: (v: Testimonial) => void }) {
  return (
    <div className="space-y-3">
      <TextArea label="Quote" value={value.quote} onChange={(t) => onChange({ ...value, quote: t })} rows={3} />
      <div className="grid gap-3 sm:grid-cols-3">
        <TextInput label="Name" value={value.name} onChange={(t) => onChange({ ...value, name: t })} />
        <TextInput label="Role" value={value.role} onChange={(t) => onChange({ ...value, role: t })} />
        <TextInput label="Company" value={value.company} onChange={(t) => onChange({ ...value, company: t })} />
      </div>
      <Toggle label="Approved for publication" hint="Only genuine testimonials the client approved in writing." checked={value.approved} onChange={(b) => onChange({ ...value, approved: b })} />
    </div>
  );
}

const emptyTestimonial: Testimonial = { quote: "", name: "", role: "", company: "", approved: false };

/* ------------------------------- Home editor ------------------------------ */

export function HomePageEditor({ initial, ...frame }: FrameProps & { initial: HomeContent }) {
  const [v, setV] = useState(initial);
  const { dirty, markSaved } = useDirty(v);
  const setHero = <K extends keyof HomeContent["hero"]>(k: K, val: HomeContent["hero"][K]) => setV((p) => ({ ...p, hero: { ...p.hero, [k]: val } }));
  const setSection = (i: number, patch: Partial<HomeSection>) => setV((p) => ({ ...p, sections: p.sections.map((s, j) => (j === i ? ({ ...s, ...patch } as HomeSection) : s)) }));
  const moveSection = (i: number, to: number) =>
    setV((p) => {
      if (to < 0 || to >= p.sections.length) return p;
      const next = [...p.sections];
      const [x] = next.splice(i, 1);
      next.splice(to, 0, x!);
      return { ...p, sections: next };
    });

  return (
    <PageEditorFrame {...frame} value={v} dirty={dirty} onSaved={markSaved} onLoadRevision={(c) => setV(normalizeHome(c))}>
      <Card title="Hero">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput className="md:col-span-2" label="Eyebrow" value={v.hero.eyebrow} maxLength={80} onChange={(t) => setHero("eyebrow", t)} />
          <TextInput className="md:col-span-2" label="Headline" value={v.hero.headline} maxLength={120} onChange={(t) => setHero("headline", t)} />
          <TextArea className="md:col-span-2" label="Description" value={v.hero.description} maxLength={400} rows={3} onChange={(t) => setHero("description", t)} />
          <div className="md:col-span-2">
            <CtaFields label="Primary button" value={v.hero.primaryCta} onChange={(c) => setHero("primaryCta", c)} />
          </div>
          <div className="md:col-span-2">
            <CtaFields label="Secondary button" value={v.hero.secondaryCta} onChange={(c) => setHero("secondaryCta", c)} />
          </div>
          <TextInput className="md:col-span-2" label="Credibility line" value={v.hero.credibility} maxLength={200} onChange={(t) => setHero("credibility", t)} hint="Optional. Keep it factual." />
          <div className="md:col-span-2">
            <MediaField label="Background image (optional)" value={v.hero.backgroundImage} onChange={(u) => setHero("backgroundImage", u)} hint="Shown faintly behind the hero. Leave empty for the default." />
          </div>
        </div>
      </Card>

      <section aria-labelledby="sections-heading" className="space-y-4">
        <div>
          <h2 id="sections-heading" className="text-[0.9375rem] font-semibold text-fg">Homepage sections</h2>
          <p className="text-xs text-fg-3">Show, hide and reorder sections. Sections with no content (e.g. no published products) are hidden automatically.</p>
        </div>
        {v.sections.map((s, i) => (
          <details key={s.key} className="group rounded-2xl border border-line bg-ink-900" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="flex-1">
                <span className="text-sm font-semibold text-fg">{SECTION_LABELS[s.key]}</span>
                <span className="block truncate text-xs text-fg-3">{s.heading}</span>
              </span>
              <span className={cn("inline-flex items-center gap-1 text-xs", s.visible ? "text-emerald-300" : "text-fg-3")}>
                {s.visible ? <Eye className="size-3.5" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
                {s.visible ? "Visible" : "Hidden"}
              </span>
              <span className="flex gap-1" onClick={(e) => e.preventDefault()}>
                <button type="button" onClick={() => moveSection(i, i - 1)} disabled={i === 0} className="rounded p-1 text-fg-3 hover:text-fg disabled:opacity-30" aria-label={`Move ${SECTION_LABELS[s.key]} up`}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => moveSection(i, i + 1)} disabled={i === v.sections.length - 1} className="rounded p-1 text-fg-3 hover:text-fg disabled:opacity-30" aria-label={`Move ${SECTION_LABELS[s.key]} down`}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
              </span>
            </summary>
            <div className="space-y-4 border-t border-line p-5">
              <Toggle label="Show this section" checked={s.visible} onChange={(b) => setSection(i, { visible: b })} />
              <TextInput label="Heading" value={s.heading} maxLength={160} onChange={(t) => setSection(i, { heading: t })} />
              <TextArea label="Description" value={s.description} maxLength={400} rows={2} onChange={(t) => setSection(i, { description: t })} />
              {s.key === "stats" ? <StatsEditor value={s.items} onChange={(items) => setSection(i, { items } as Partial<HomeSection>)} /> : null}
              {s.key === "why" || s.key === "process" ? (
                <TitledListEditor label={s.key === "why" ? "Differentiators" : "Steps"} itemLabel={s.key === "why" ? "card" : "step"} value={s.items} onChange={(items) => setSection(i, { items } as Partial<HomeSection>)} />
              ) : null}
              {s.key === "proof" ? (
                <div className="space-y-5">
                  <TextInput label="Heading when there are no approved testimonials" value={s.fallbackHeading} onChange={(t) => setSection(i, { fallbackHeading: t } as Partial<HomeSection>)} />
                  <TitledListEditor label="Highlights (shown when no testimonials are approved)" itemLabel="highlight" value={s.highlights} onChange={(highlights) => setSection(i, { highlights } as Partial<HomeSection>)} />
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-fg">Testimonials</legend>
                    <ul className="space-y-3">
                      {s.testimonials.map((t, ti) => (
                        <li key={ti} className="rounded-xl border border-line bg-ink-950/50 p-3">
                          <TestimonialFields value={t} onChange={(nt) => setSection(i, { testimonials: s.testimonials.map((x, xi) => (xi === ti ? nt : x)) } as Partial<HomeSection>)} />
                          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSection(i, { testimonials: s.testimonials.filter((_, xi) => xi !== ti) } as Partial<HomeSection>)}>
                            <Trash2 className="size-4" aria-hidden="true" /> Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSection(i, { testimonials: [...s.testimonials, emptyTestimonial] } as Partial<HomeSection>)}>
                      <Plus className="size-4" aria-hidden="true" /> Add testimonial
                    </Button>
                  </fieldset>
                </div>
              ) : null}
              {s.key === "cta" ? (
                <div className="space-y-3">
                  <CtaFields label="Primary button" value={s.primaryCta} onChange={(c) => setSection(i, { primaryCta: c } as Partial<HomeSection>)} />
                  <CtaFields label="Secondary button" value={s.secondaryCta} onChange={(c) => setSection(i, { secondaryCta: c } as Partial<HomeSection>)} />
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </section>
    </PageEditorFrame>
  );
}

/* ----------------------------- Generic editor ----------------------------- */

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  richText: "Rich text",
  image: "Image",
  cta: "Call to action",
  featureGrid: "Feature grid",
  stats: "Statistics",
  faq: "FAQ",
  testimonial: "Testimonial",
};

function newBlock(type: BlockType): Block {
  const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
  switch (type) {
    case "heading":
      return { id, type, text: "", level: 2 };
    case "paragraph":
      return { id, type, text: "" };
    case "richText":
      return { id, type, markdown: "" };
    case "image":
      return { id, type, url: "", alt: "", caption: "" };
    case "cta":
      return { id, type, heading: "", description: "", label: "Start a Project", href: "/contact" };
    case "featureGrid":
      return { id, type, heading: "", items: [] };
    case "stats":
      return { id, type, items: [] };
    case "faq":
      return { id, type, heading: "Frequently asked questions", items: [] };
    case "testimonial":
      return { id, type, testimonial: emptyTestimonial };
  }
}

function BlockFields({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <TextInput label="Text" value={block.text} onChange={(t) => onChange({ ...block, text: t })} />
          <SelectInput label="Level" value={String(block.level) as "2" | "3"} onChange={(l) => onChange({ ...block, level: Number(l) as 2 | 3 })} options={[{ value: "2", label: "Section (H2)" }, { value: "3", label: "Sub-section (H3)" }]} />
        </div>
      );
    case "paragraph":
      return <TextArea label="Text" value={block.text} rows={4} onChange={(t) => onChange({ ...block, text: t })} />;
    case "richText":
      return <MarkdownField label="Content" value={block.markdown} onChange={(t) => onChange({ ...block, markdown: t })} />;
    case "image":
      return (
        <div className="space-y-3">
          <MediaField label="Image" value={block.url} onChange={(u, asset) => onChange({ ...block, url: u, alt: block.alt || asset?.altText || "" })} />
          <TextInput label="Alt text" value={block.alt} onChange={(t) => onChange({ ...block, alt: t })} hint="Describe the image for screen reader users." />
          <TextInput label="Caption" value={block.caption} onChange={(t) => onChange({ ...block, caption: t })} />
        </div>
      );
    case "cta":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Heading" value={block.heading} onChange={(t) => onChange({ ...block, heading: t })} />
          <TextInput label="Description" value={block.description} onChange={(t) => onChange({ ...block, description: t })} />
          <TextInput label="Button label" value={block.label} onChange={(t) => onChange({ ...block, label: t })} />
          <TextInput label="Button link" value={block.href} onChange={(t) => onChange({ ...block, href: t })} />
        </div>
      );
    case "featureGrid":
      return (
        <div className="space-y-3">
          <TextInput label="Heading" value={block.heading} onChange={(t) => onChange({ ...block, heading: t })} />
          <TitledListEditor label="Items" value={block.items} onChange={(items) => onChange({ ...block, items })} />
        </div>
      );
    case "stats":
      return <StatsEditor value={block.items} onChange={(items) => onChange({ ...block, items })} />;
    case "faq":
      return (
        <div className="space-y-3">
          <TextInput label="Heading" value={block.heading} onChange={(t) => onChange({ ...block, heading: t })} />
          <FaqEditor value={block.items} onChange={(items) => onChange({ ...block, items })} label="Questions" />
        </div>
      );
    case "testimonial":
      return <TestimonialFields value={block.testimonial} onChange={(t) => onChange({ ...block, testimonial: t })} />;
  }
}

export function GenericPageEditor({ initial, pageKey, ...frame }: FrameProps & { initial: GenericPageContent; pageKey: string }) {
  const [v, setV] = useState(initial);
  const [adding, setAdding] = useState<BlockType>("richText");
  const { dirty, markSaved } = useDirty(v);
  const setBlocks = (blocks: Block[]) => setV((p) => ({ ...p, blocks }));
  const move = (i: number, to: number) => {
    if (to < 0 || to >= v.blocks.length) return;
    const next = [...v.blocks];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x!);
    setBlocks(next);
  };

  return (
    <PageEditorFrame {...frame} value={v} dirty={dirty} onSaved={markSaved} onLoadRevision={(c) => setV(normalizeGenericPage(c, initial))}>
      <Card title="Page header">
        <div className="space-y-4">
          <TextInput label="Heading" value={v.heading} maxLength={160} onChange={(t) => setV({ ...v, heading: t })} />
          <TextArea label="Introduction" value={v.intro} maxLength={600} rows={3} onChange={(t) => setV({ ...v, intro: t })} />
          {pageKey === "about" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <TextArea label="Mission" value={v.mission ?? ""} maxLength={400} rows={3} onChange={(t) => setV({ ...v, mission: t })} />
              <TextArea label="Vision" value={v.vision ?? ""} maxLength={400} rows={3} onChange={(t) => setV({ ...v, vision: t })} />
            </div>
          ) : null}
          <TextArea
            label="Notice banner"
            value={v.notice ?? ""}
            maxLength={400}
            rows={2}
            onChange={(t) => setV({ ...v, notice: t })}
            hint={pageKey === "privacy" || pageKey === "terms" ? "Keep the draft notice until a legal professional has reviewed this page." : "Optional highlighted note shown under the header."}
          />
        </div>
      </Card>

      <section aria-labelledby="blocks-heading" className="space-y-3">
        <h2 id="blocks-heading" className="text-[0.9375rem] font-semibold text-fg">Content blocks</h2>
        {v.blocks.length === 0 ? <p className="text-sm text-fg-3">No content blocks yet.</p> : null}
        {v.blocks.map((b, i) => (
          <div key={b.id} className="rounded-2xl border border-line bg-ink-900">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-sm font-medium text-fg">{BLOCK_LABELS[b.type]}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded p-1.5 text-fg-3 hover:text-fg disabled:opacity-30" aria-label="Move block up">
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === v.blocks.length - 1} className="rounded p-1.5 text-fg-3 hover:text-fg disabled:opacity-30" aria-label="Move block down">
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setBlocks(v.blocks.filter((_, j) => j !== i))} className="rounded p-1.5 text-fg-3 hover:text-red-300" aria-label="Remove block">
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <BlockFields block={b} onChange={(nb) => setBlocks(v.blocks.map((x, j) => (j === i ? nb : x)))} />
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-line p-4">
          <label className="text-sm text-fg-3">
            Add block
            <select value={adding} onChange={(e) => setAdding(e.target.value as BlockType)} className={cn(inputCls, "mt-1 h-10 w-48")}>
              {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
                <option key={t} value={t}>
                  {BLOCK_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <Button variant="secondary" size="sm" className="h-10" onClick={() => setBlocks([...v.blocks, newBlock(adding)])}>
            <Plus className="size-4" aria-hidden="true" /> Add
          </Button>
        </div>
      </section>
    </PageEditorFrame>
  );
}
