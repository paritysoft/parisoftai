"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSeoOverrideAction, saveSeoOverrideAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { ConfirmButton, FormMessage, TextArea, TextInput, Toggle } from "@/components/admin/form-controls";
import { MediaField } from "@/components/admin/media";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SeoOverride } from "@/types/content";

export interface SeoPathRow {
  path: string;
  label: string;
  published: boolean;
}

const empty = (path: string): SeoOverride => ({ path, title: null, description: null, ogTitle: null, ogDescription: null, ogImage: null, canonicalUrl: null, noindex: false });

export function SeoManager({ paths, overrides }: { paths: SeoPathRow[]; overrides: SeoOverride[] }) {
  const router = useRouter();
  const map = new Map(overrides.map((o) => [o.path, o]));
  const [current, setCurrent] = useState<string>(paths[0]?.path ?? "/");
  const [form, setForm] = useState<SeoOverride>(map.get(current) ?? empty(current));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();

  const select = (p: string) => {
    setCurrent(p);
    setForm(map.get(p) ?? empty(p));
    setErrors({});
    setResult(null);
  };
  const s = (k: keyof SeoOverride) => (form[k] as string | null) ?? "";
  const set = (k: keyof SeoOverride, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <nav aria-label="Pages" className="rounded-2xl border border-line bg-ink-900 p-2">
        <ul className="max-h-[70vh] overflow-y-auto">
          {paths.map((p) => {
            const o = map.get(p.path);
            return (
              <li key={p.path}>
                <button type="button" onClick={() => select(p.path)} aria-current={current === p.path ? "true" : undefined} className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm", current === p.path ? "bg-accent/15 text-fg" : "text-fg-3 hover:bg-white/[0.04] hover:text-fg")}>
                  <span className="min-w-0">
                    <span className="block truncate">{p.label}</span>
                    <span className="block truncate text-xs text-fg-3">{p.path}</span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {!p.published ? <Badge>Unpublished</Badge> : null}
                    {o?.noindex ? <Badge tone="warning">noindex</Badge> : o ? <Badge tone="accent">Custom</Badge> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-4 rounded-2xl border border-line bg-ink-900 p-5">
        <h2 className="font-semibold text-fg">
          SEO for <code className="text-indigo-200">{current}</code>
        </h2>
        <p className="text-xs text-fg-3">Leave fields empty to use the page&apos;s own title and description. Unpublished pages never appear in the sitemap.</p>
        <TextInput label="SEO title" value={s("title")} onChange={(v) => set("title", v)} maxLength={70} error={errors.title} hint="Used as-is (no site name appended)." />
        <TextArea label="Meta description" value={s("description")} onChange={(v) => set("description", v)} maxLength={170} rows={3} error={errors.description} />
        <TextInput label="Open Graph title" value={s("ogTitle")} onChange={(v) => set("ogTitle", v)} maxLength={90} />
        <TextArea label="Open Graph description" value={s("ogDescription")} onChange={(v) => set("ogDescription", v)} maxLength={200} rows={2} />
        <MediaField label="Open Graph image" value={s("ogImage")} onChange={(v) => set("ogImage", v)} hint="1200×630 recommended." />
        <TextInput label="Canonical URL" value={s("canonicalUrl")} onChange={(v) => set("canonicalUrl", v)} error={errors.canonicalUrl} hint="Only if this page duplicates another URL. Must be https://" />
        <Toggle label="Hide from search engines (noindex)" hint="Also removes the page from the sitemap." checked={form.noindex} onChange={(b) => set("noindex", b)} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await saveSeoOverrideAction({ ...form, title: s("title"), description: s("description"), ogTitle: s("ogTitle"), ogDescription: s("ogDescription"), ogImage: s("ogImage"), canonicalUrl: s("canonicalUrl") });
                setResult(r.ok ? { ok: true, message: r.message } : { ok: false, error: r.error });
                setErrors(r.ok ? {} : r.fieldErrors ?? {});
                if (r.ok) router.refresh();
              })
            }
          >
            Save SEO
          </Button>
          {map.has(current) ? (
            <ConfirmButton
              variant="secondary"
              size="md"
              confirmText="Remove the custom SEO settings for this page?"
              onConfirm={() =>
                start(async () => {
                  const r = await deleteSeoOverrideAction(current);
                  setResult(r.ok ? { ok: true, message: r.message } : { ok: false, error: r.error });
                  if (r.ok) {
                    setForm(empty(current));
                    router.refresh();
                  }
                })
              }
            >
              Reset to defaults
            </ConfirmButton>
          ) : null}
        </div>
        <FormMessage result={result} />
      </div>
    </div>
  );
}
