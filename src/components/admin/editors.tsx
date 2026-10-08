"use client";

import { useState } from "react";
import { Card } from "@/components/admin/ui";
import { EditorFrame } from "@/components/admin/editor-frame";
import {
  CheckboxGroup,
  FaqEditor,
  LinkListEditor,
  MarkdownField,
  SelectInput,
  StringListEditor,
  TagInput,
  TextArea,
  TextInput,
  TitledListEditor,
  Toggle,
  useDirty,
} from "@/components/admin/form-controls";
import { GalleryEditor, MediaField } from "@/components/admin/media";
import { ICON_NAMES } from "@/components/ui/icon";
import { slugify } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORMS, type Product, type Project, type Service } from "@/types/content";

interface Common {
  id: string | null;
  canPublish: boolean;
  canDelete: boolean;
  updatedAt?: string | null;
}

const platformOptions = PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }));

function useSlugSync(isNew: boolean) {
  const [touched, setTouched] = useState(!isNew);
  return { auto: !touched, touch: () => setTouched(true) };
}

function SeoCard({ title, description, onTitle, onDescription }: { title: string; description: string; onTitle: (v: string) => void; onDescription: (v: string) => void }) {
  return (
    <Card title="Search engine listing" description="Optional. Falls back to the title and short description.">
      <div className="space-y-4">
        <TextInput label="SEO title" value={title} onChange={onTitle} maxLength={70} />
        <TextArea label="Meta description" value={description} onChange={onDescription} maxLength={170} rows={3} />
      </div>
    </Card>
  );
}

/* --------------------------------- Service -------------------------------- */

export type ServiceForm = Omit<Service, "id" | "updatedAt" | "seoTitle" | "seoDescription" | "coverImage"> & { seoTitle: string; seoDescription: string; coverImage: string };

export function ServiceEditor({ initial, ...common }: Common & { initial: ServiceForm }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { dirty, markSaved } = useDirty(v);
  const slugSync = useSlugSync(!common.id);
  const set = <K extends keyof ServiceForm>(k: K, val: ServiceForm[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <EditorFrame collection="services" value={v} dirty={dirty} onSaved={markSaved} onStatus={(s) => set("status", s)} publicPrefix="/services/" listHref="/admin/services" onFieldErrors={setErrors} {...common}>
      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Title" required value={v.title} error={errors.title} maxLength={120} onChange={(t) => setV((p) => ({ ...p, title: t, slug: slugSync.auto ? slugify(t) : p.slug }))} />
          <TextInput label="Slug" required value={v.slug} error={errors.slug} hint={`URL: /services/${v.slug || "…"}`} onChange={(s) => { slugSync.touch(); set("slug", s); }} />
          <SelectInput label="Icon" value={v.icon ?? "code"} onChange={(i) => set("icon", i)} options={ICON_NAMES.map((n) => ({ value: n, label: n }))} />
          <TextInput label="Display order" type="number" value={String(v.sortOrder)} onChange={(n) => set("sortOrder", Number(n) || 0)} hint="Lower numbers appear first." />
          <TextArea className="md:col-span-2" label="Short description" required value={v.shortDescription} error={errors.shortDescription} maxLength={320} rows={2} onChange={(t) => set("shortDescription", t)} hint="Shown on cards." />
          <TextArea className="md:col-span-2" label="Full description" value={v.fullDescription} rows={4} onChange={(t) => set("fullDescription", t)} hint="Shown at the top of the service page." />
        </div>
      </Card>
      <Card title="Page content">
        <div className="space-y-6">
          <StringListEditor label="Client problems addressed" value={v.problems} onChange={(x) => set("problems", x)} />
          <TitledListEditor label="Capabilities" itemLabel="capability" value={v.features} onChange={(x) => set("features", x)} />
          <StringListEditor label="Benefits" value={v.benefits} onChange={(x) => set("benefits", x)} />
          <TitledListEditor label="Development approach" itemLabel="step" value={v.approach} onChange={(x) => set("approach", x)} />
          <TagInput label="Technologies" value={v.technologies} onChange={(x) => set("technologies", x)} />
          <FaqEditor value={v.faq} onChange={(x) => set("faq", x)} />
        </div>
      </Card>
      <Card title="Media">
        <MediaField label="Cover image" value={v.coverImage} onChange={(u) => set("coverImage", u)} />
      </Card>
      <SeoCard title={v.seoTitle} description={v.seoDescription} onTitle={(t) => set("seoTitle", t)} onDescription={(t) => set("seoDescription", t)} />
    </EditorFrame>
  );
}

/* --------------------------------- Project -------------------------------- */

export type ProjectForm = Omit<Project, "id" | "updatedAt" | "seoTitle" | "seoDescription" | "coverImage" | "challenge" | "solution" | "attribution"> & {
  seoTitle: string;
  seoDescription: string;
  coverImage: string;
  challenge: string;
  solution: string;
  attribution: string;
};

export function ProjectEditor({ initial, ...common }: Common & { initial: ProjectForm }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { dirty, markSaved } = useDirty(v);
  const slugSync = useSlugSync(!common.id);
  const set = <K extends keyof ProjectForm>(k: K, val: ProjectForm[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <EditorFrame collection="portfolio" value={v} dirty={dirty} onSaved={markSaved} onStatus={(s) => set("status", s)} publicPrefix="/work/" listHref="/admin/portfolio" onFieldErrors={setErrors} {...common}>
      <div role="note" className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-sm text-amber-100">
        Publish only verified work you have permission to show. Never invent clients, outcomes or metrics.
      </div>
      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Project name" required value={v.title} error={errors.title} maxLength={120} onChange={(t) => setV((p) => ({ ...p, title: t, slug: slugSync.auto ? slugify(t) : p.slug }))} />
          <TextInput label="Slug" required value={v.slug} error={errors.slug} hint={`URL: /work/${v.slug || "…"}`} onChange={(s) => { slugSync.touch(); set("slug", s); }} />
          <TextInput label="Category" required value={v.category} error={errors.category} placeholder="e.g. Health & Fitness" onChange={(t) => set("category", t)} />
          <SelectInput
            label="Ownership"
            value={v.ownership}
            onChange={(o) => set("ownership", o)}
            options={[
              { value: "client", label: "Client project" },
              { value: "company", label: "Company-owned product" },
            ]}
          />
          <TextArea className="md:col-span-2" label="Short description" required value={v.summary} error={errors.summary} maxLength={320} rows={2} onChange={(t) => set("summary", t)} />
          <TextInput className="md:col-span-2" label="Attribution / permission note" value={v.attribution} maxLength={200} onChange={(t) => set("attribution", t)} hint='Optional, e.g. "Shown with permission of Acme Ltd." or "Client name withheld (NDA)."' />
          <div className="md:col-span-2">
            <CheckboxGroup label="Platforms" options={platformOptions} value={v.platforms} onChange={(x) => set("platforms", x)} />
          </div>
          <div className="md:col-span-2">
            <TagInput label="Technology stack" value={v.technologies} onChange={(x) => set("technologies", x)} />
          </div>
          <TextInput label="Display order" type="number" value={String(v.sortOrder)} onChange={(n) => set("sortOrder", Number(n) || 0)} />
          <div className="flex items-end pb-1">
            <Toggle label="Featured on homepage" checked={v.featured} onChange={(b) => set("featured", b)} />
          </div>
        </div>
      </Card>
      <Card title="Case study">
        <div className="space-y-6">
          <MarkdownField label="Challenge" value={v.challenge} rows={5} onChange={(t) => set("challenge", t)} />
          <MarkdownField label="Solution" value={v.solution} rows={5} onChange={(t) => set("solution", t)} />
          <MarkdownField label="Detailed description" value={v.description} onChange={(t) => set("description", t)} />
          <StringListEditor label="Verified results" hint="Only include results you can substantiate." value={v.results} onChange={(x) => set("results", x)} />
          <LinkListEditor label="External links" value={v.externalLinks} onChange={(x) => set("externalLinks", x)} />
        </div>
      </Card>
      <Card title="Images">
        <div className="space-y-6">
          <MediaField label="Cover image" value={v.coverImage} onChange={(u) => set("coverImage", u)} />
          <GalleryEditor label="Screenshot gallery" value={v.screenshots} onChange={(x) => set("screenshots", x)} />
        </div>
      </Card>
      <SeoCard title={v.seoTitle} description={v.seoDescription} onTitle={(t) => set("seoTitle", t)} onDescription={(t) => set("seoDescription", t)} />
    </EditorFrame>
  );
}

/* --------------------------------- Product -------------------------------- */

export type ProductForm = Omit<Product, "id" | "updatedAt" | "seoTitle" | "seoDescription" | "icon" | "appStoreUrl" | "googlePlayUrl" | "microsoftStoreUrl" | "websiteUrl"> & {
  seoTitle: string;
  seoDescription: string;
  icon: string;
  appStoreUrl: string;
  googlePlayUrl: string;
  microsoftStoreUrl: string;
  websiteUrl: string;
};

export function ProductEditor({ initial, ...common }: Common & { initial: ProductForm }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { dirty, markSaved } = useDirty(v);
  const slugSync = useSlugSync(!common.id);
  const set = <K extends keyof ProductForm>(k: K, val: ProductForm[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <EditorFrame collection="products" value={v} dirty={dirty} onSaved={markSaved} onStatus={(s) => set("status", s)} publicPrefix="/products/" listHref="/admin/products" onFieldErrors={setErrors} {...common}>
      <Card title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="Product name" required value={v.name} error={errors.name} maxLength={80} onChange={(t) => setV((p) => ({ ...p, name: t, slug: slugSync.auto ? slugify(t) : p.slug }))} />
          <TextInput label="Slug" required value={v.slug} error={errors.slug} hint={`URL: /products/${v.slug || "…"}`} onChange={(s) => { slugSync.touch(); set("slug", s); }} />
          <TextInput label="Category" required value={v.category} error={errors.category} placeholder="e.g. Productivity" onChange={(t) => set("category", t)} />
          <TextInput label="Display order" type="number" value={String(v.sortOrder)} onChange={(n) => set("sortOrder", Number(n) || 0)} />
          <TextArea className="md:col-span-2" label="One-sentence description" required value={v.tagline} error={errors.tagline} maxLength={200} rows={2} onChange={(t) => set("tagline", t)} />
          <div className="md:col-span-2">
            <CheckboxGroup label="Platforms" options={platformOptions} value={v.platforms} onChange={(x) => set("platforms", x)} />
          </div>
          <div className="md:col-span-2">
            <Toggle label="Featured on homepage" checked={v.featured} onChange={(b) => set("featured", b)} />
          </div>
        </div>
      </Card>
      <Card title="Store links" description="Only links that are filled in are shown. Must start with https://">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="App Store URL" value={v.appStoreUrl} error={errors.appStoreUrl} onChange={(t) => set("appStoreUrl", t)} />
          <TextInput label="Google Play URL" value={v.googlePlayUrl} error={errors.googlePlayUrl} onChange={(t) => set("googlePlayUrl", t)} />
          <TextInput label="Microsoft Store URL" value={v.microsoftStoreUrl} error={errors.microsoftStoreUrl} onChange={(t) => set("microsoftStoreUrl", t)} />
          <TextInput label="Official website" value={v.websiteUrl} error={errors.websiteUrl} onChange={(t) => set("websiteUrl", t)} />
        </div>
      </Card>
      <Card title="Product page">
        <div className="space-y-6">
          <MarkdownField label="Description" value={v.description} onChange={(t) => set("description", t)} />
          <StringListEditor label="Features" value={v.features} onChange={(x) => set("features", x)} />
        </div>
      </Card>
      <Card title="Images">
        <div className="space-y-6">
          <MediaField label="App icon" value={v.icon} onChange={(u) => set("icon", u)} hint="Square image, at least 256×256." />
          <GalleryEditor label="Screenshots" value={v.screenshots} onChange={(x) => set("screenshots", x)} />
        </div>
      </Card>
      <SeoCard title={v.seoTitle} description={v.seoDescription} onTitle={(t) => set("seoTitle", t)} onDescription={(t) => set("seoDescription", t)} />
    </EditorFrame>
  );
}
