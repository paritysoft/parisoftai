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
import { useEditorBackend } from "@/components/admin/editor-backend";
import { ICON_NAMES } from "@/components/ui/icon";
import { slugify } from "@/lib/utils";
import { PLATFORM_LABELS, PLATFORMS, type Product, type Project, type Service } from "@/types/content";

interface Common {
  id: string | null;
  /** Admin list URL (defaults to the Supabase CMS routes). */
  listHref?: string;
  canPublish: boolean;
  canDelete: boolean;
  updatedAt?: string | null;
}

const platformOptions = PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }));

function useSlugSync(isNew: boolean) {
  const [touched, setTouched] = useState(!isNew);
  return { auto: !touched, touch: () => setTouched(true) };
}

function SeoCard({
  title,
  description,
  onTitle,
  onDescription,
  ogImage,
  onOgImage,
}: {
  title: string;
  description: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  ogImage?: string;
  onOgImage?: (v: string) => void;
}) {
  const { ImageField } = useEditorBackend();
  return (
    <Card title="Search engine listing" description="Optional. Falls back to the title and short description.">
      <div className="space-y-4">
        <TextInput label="SEO title" value={title} onChange={onTitle} maxLength={70} hint="Shown in search results and browser tabs. Aim for 30–60 characters." />
        <TextArea label="Meta description" value={description} onChange={onDescription} maxLength={170} rows={3} hint="Aim for 70–160 characters." />
        {onOgImage ? <ImageField label="Social sharing image (Open Graph)" value={ogImage ?? ""} onChange={onOgImage} hint="Optional. 1200×630 recommended. Falls back to the cover image." /> : null}
      </div>
    </Card>
  );
}

function dateInputValue(v: string): string {
  return v ? v.slice(0, 10) : "";
}

/* --------------------------------- Service -------------------------------- */

export type ServiceForm = Omit<Service, "id" | "updatedAt" | "seoTitle" | "seoDescription" | "coverImage"> & { seoTitle: string; seoDescription: string; coverImage: string };

export function ServiceEditor({ initial, ...common }: Common & { initial: ServiceForm }) {
  const { ImageField: MediaField } = useEditorBackend();
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

type NullableToString<T, K extends keyof T> = Omit<T, K> & { [P in K]: string };

export type ProjectForm = NullableToString<
  Omit<Project, "id" | "updatedAt">,
  "seoTitle" | "seoDescription" | "coverImage" | "challenge" | "solution" | "attribution" | "projectUrl" | "appStoreUrl" | "googlePlayUrl" | "microsoftStoreUrl" | "ogImage" | "publishedAt"
>;

export function ProjectEditor({ initial, ...common }: Common & { initial: ProjectForm }) {
  const { ImageField, GalleryField } = useEditorBackend();
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
          <TextArea className="md:col-span-2" label="Short description" required value={v.summary} error={errors.summary} maxLength={320} rows={2} onChange={(t) => set("summary", t)} hint="Shown on cards and used as the meta description if none is set." />
          {v.ownership === "client" ? (
            <div className="md:col-span-2 rounded-xl border border-line bg-ink-950/40 p-4">
              <Toggle
                label="The client has authorised publishing this project"
                checked={v.clientApproved}
                onChange={(b) => set("clientApproved", b)}
                hint="Required before a client project can be published."
              />
              {errors.clientApproved ? <p role="alert" className="mt-2 text-xs text-red-300">{errors.clientApproved}</p> : null}
            </div>
          ) : null}
          <TextInput className="md:col-span-2" label="Attribution / permission note" value={v.attribution} maxLength={200} onChange={(t) => set("attribution", t)} hint='Optional, e.g. "Shown with permission of Acme Ltd." or "Client name withheld (NDA)."' />
          <div className="md:col-span-2">
            <CheckboxGroup label="Platforms" options={platformOptions} value={v.platforms} onChange={(x) => set("platforms", x)} />
          </div>
          <div className="md:col-span-2">
            <TagInput label="Technology stack" value={v.technologies} onChange={(x) => set("technologies", x)} />
          </div>
          <TextInput label="Display order" type="number" value={String(v.sortOrder)} onChange={(n) => set("sortOrder", Number(n) || 0)} hint="Lower numbers appear first." />
          <TextInput label="Publication date" type="date" value={dateInputValue(v.publishedAt)} error={errors.publishedAt} onChange={(d) => set("publishedAt", d)} hint="Set automatically when first published." />
          <div className="md:col-span-2">
            <Toggle label="Featured on homepage" checked={v.featured} onChange={(b) => set("featured", b)} />
          </div>
        </div>
      </Card>
      <Card title="Links" description="Optional. Only filled-in links are shown. Must start with https://">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput className="md:col-span-2" label="Project URL" value={v.projectUrl} error={errors.projectUrl} placeholder="https://" onChange={(t) => set("projectUrl", t)} />
          <TextInput label="App Store URL" value={v.appStoreUrl} error={errors.appStoreUrl} placeholder="https://apps.apple.com/…" onChange={(t) => set("appStoreUrl", t)} />
          <TextInput label="Google Play URL" value={v.googlePlayUrl} error={errors.googlePlayUrl} placeholder="https://play.google.com/…" onChange={(t) => set("googlePlayUrl", t)} />
          <TextInput label="Microsoft Store URL" value={v.microsoftStoreUrl} error={errors.microsoftStoreUrl} placeholder="https://apps.microsoft.com/…" onChange={(t) => set("microsoftStoreUrl", t)} />
        </div>
      </Card>
      <Card title="Case study">
        <div className="space-y-6">
          <StringListEditor label="Key features" value={v.keyFeatures} onChange={(x) => set("keyFeatures", x)} />
          <MarkdownField label="Challenge" value={v.challenge} rows={5} onChange={(t) => set("challenge", t)} />
          <MarkdownField label="Solution" value={v.solution} rows={5} onChange={(t) => set("solution", t)} />
          <MarkdownField label="Full description" value={v.description} onChange={(t) => set("description", t)} />
          <StringListEditor label="Verified results" hint="Only include results you can substantiate." value={v.results} onChange={(x) => set("results", x)} />
          <LinkListEditor label="Other links" value={v.externalLinks} onChange={(x) => set("externalLinks", x)} />
        </div>
      </Card>
      <Card title="Images">
        <div className="space-y-6">
          <ImageField label="Cover image" value={v.coverImage} onChange={(u) => set("coverImage", u)} hint="16:10 landscape works best (e.g. 1600×1000)." />
          <GalleryField label="Gallery screenshots" value={v.screenshots} onChange={(x) => set("screenshots", x)} />
        </div>
      </Card>
      <SeoCard title={v.seoTitle} description={v.seoDescription} onTitle={(t) => set("seoTitle", t)} onDescription={(t) => set("seoDescription", t)} ogImage={v.ogImage} onOgImage={(u) => set("ogImage", u)} />
    </EditorFrame>
  );
}

/* --------------------------------- Product -------------------------------- */

export type ProductForm = NullableToString<
  Omit<Product, "id" | "updatedAt">,
  "seoTitle" | "seoDescription" | "icon" | "appStoreUrl" | "googlePlayUrl" | "microsoftStoreUrl" | "websiteUrl" | "ogImage" | "publishedAt"
>;

export function ProductEditor({ initial, ...common }: Common & { initial: ProductForm }) {
  const { ImageField, GalleryField } = useEditorBackend();
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
          <TextInput label="Display order" type="number" value={String(v.sortOrder)} onChange={(n) => set("sortOrder", Number(n) || 0)} hint="Lower numbers appear first." />
          <TextInput label="Publication date" type="date" value={dateInputValue(v.publishedAt)} error={errors.publishedAt} onChange={(d) => set("publishedAt", d)} hint="Set automatically when first published." />
          <div className="md:col-span-2">
            <TagInput label="Categories" value={v.categories} onChange={(x) => set("categories", x)} hint="e.g. Productivity, Health & Fitness. The first is the primary category." />
            {errors.categories ? <p role="alert" className="mt-1 text-xs text-red-300">{errors.categories}</p> : null}
          </div>
          <TextArea className="md:col-span-2" label="Short description" required value={v.tagline} error={errors.tagline} maxLength={200} rows={2} onChange={(t) => set("tagline", t)} hint="One sentence shown on product cards." />
          <div className="md:col-span-2">
            <CheckboxGroup label="Supported platforms" options={platformOptions} value={v.platforms} onChange={(x) => set("platforms", x)} />
          </div>
          <div className="md:col-span-2">
            <Toggle label="Featured on homepage" checked={v.featured} onChange={(b) => set("featured", b)} />
          </div>
        </div>
      </Card>
      <Card title="Store links" description="Only links that are filled in are shown. Must start with https://">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput label="App Store URL" value={v.appStoreUrl} error={errors.appStoreUrl} placeholder="https://apps.apple.com/…" onChange={(t) => set("appStoreUrl", t)} />
          <TextInput label="Google Play URL" value={v.googlePlayUrl} error={errors.googlePlayUrl} placeholder="https://play.google.com/…" onChange={(t) => set("googlePlayUrl", t)} />
          <TextInput label="Microsoft Store URL" value={v.microsoftStoreUrl} error={errors.microsoftStoreUrl} placeholder="https://apps.microsoft.com/…" onChange={(t) => set("microsoftStoreUrl", t)} />
          <TextInput label="Official website" value={v.websiteUrl} error={errors.websiteUrl} placeholder="https://" onChange={(t) => set("websiteUrl", t)} />
        </div>
      </Card>
      <Card title="Product page">
        <div className="space-y-6">
          <MarkdownField label="Detailed description" value={v.description} onChange={(t) => set("description", t)} />
          <StringListEditor label="Key features" value={v.features} onChange={(x) => set("features", x)} />
        </div>
      </Card>
      <Card title="Images">
        <div className="space-y-6">
          <ImageField label="Product icon" value={v.icon} onChange={(u) => set("icon", u)} hint="Square image, at least 256×256." />
          <GalleryField label="Screenshots" value={v.screenshots} onChange={(x) => set("screenshots", x)} />
        </div>
      </Card>
      <SeoCard title={v.seoTitle} description={v.seoDescription} onTitle={(t) => set("seoTitle", t)} onDescription={(t) => set("seoDescription", t)} ogImage={v.ogImage} onOgImage={(u) => set("ogImage", u)} />
    </EditorFrame>
  );
}
