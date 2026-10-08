"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye, History, Loader2, Save, Send } from "lucide-react";
import { publishPageAction, savePageDraftAction } from "@/actions/pages";
import { Button } from "@/components/ui/button";
import { ConfirmButton, FormMessage, useUnsavedChanges } from "@/components/admin/form-controls";
import { formatDateTime } from "@/lib/utils";

export interface Revision {
  id: string;
  kind: "draft" | "published";
  createdAt: string;
  author: string | null;
  content: unknown;
}

type Res = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function PageEditorFrame<T>({
  pageId,
  path,
  value,
  dirty,
  onSaved,
  onLoadRevision,
  canPublish,
  hasUnpublishedDraft,
  publishedAt,
  revisions,
  children,
}: {
  pageId: string;
  path: string;
  value: T;
  dirty: boolean;
  onSaved: (v: T) => void;
  onLoadRevision: (content: unknown) => void;
  canPublish: boolean;
  hasUnpublishedDraft: boolean;
  publishedAt: string | null;
  revisions: Revision[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Res | null>(null);
  useUnsavedChanges(dirty && !pending);

  const run = (fn: () => Promise<Res>) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) {
        onSaved(value);
        router.refresh();
      }
    });

  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="space-y-3 rounded-2xl border border-line bg-ink-900 p-5">
          <p className="text-xs text-fg-3">
            {publishedAt ? `Last published ${formatDateTime(publishedAt)}` : "Not published yet"}
            {hasUnpublishedDraft ? <span className="mt-1 block text-amber-200">A saved draft has unpublished changes.</span> : null}
          </p>
          <Button variant="secondary" className="w-full" disabled={pending} onClick={() => run(() => savePageDraftAction(pageId, value) as Promise<Res>)}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />} Save draft
          </Button>
          {canPublish ? (
            <ConfirmButton variant="primary" size="md" className="w-full" disabled={pending} confirmText="Publish this version? It will replace the live page immediately." onConfirm={() => run(() => publishPageAction(pageId, value) as Promise<Res>)}>
              <Send className="size-4" aria-hidden="true" /> Publish
            </ConfirmButton>
          ) : (
            <p className="text-xs text-fg-3">Editors save drafts. An admin publishes.</p>
          )}
          {dirty ? <p className="text-xs text-amber-200">You have unsaved changes.</p> : null}
          <FormMessage result={result ? (result.ok ? { ok: true, message: result.message } : { ok: false, error: result.error }) : null} />
          {fieldErrors ? (
            <ul className="space-y-1 text-xs text-red-300">
              {Object.entries(fieldErrors).slice(0, 8).map(([k, msg]) => (
                <li key={k}>
                  <code className="text-red-200">{k}</code>: {msg}
                </li>
              ))}
            </ul>
          ) : null}
          <form action="/api/preview" method="GET" target="_blank">
            <input type="hidden" name="path" value={path} />
            <Button type="submit" variant="ghost" size="sm" className="w-full">
              <Eye className="size-4" aria-hidden="true" /> Preview latest saved draft
            </Button>
          </form>
        </div>
        {revisions.length > 0 ? (
          <details className="rounded-2xl border border-line bg-ink-900 p-5">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
              <History className="size-4" aria-hidden="true" /> Revision history
            </summary>
            <ul className="mt-3 space-y-2">
              {revisions.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-fg-3">
                    <span className={r.kind === "published" ? "text-emerald-300" : "text-amber-200"}>{r.kind === "published" ? "Published" : "Draft"}</span> · {formatDateTime(r.createdAt)}
                    {r.author ? <span className="block">{r.author}</span> : null}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => onLoadRevision(r.content)}>
                    Load
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-fg-3">Loading a revision replaces the editor contents. Save or publish to keep it.</p>
          </details>
        ) : null}
      </aside>
    </div>
  );
}
