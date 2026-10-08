"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton, FormMessage, SelectInput, useUnsavedChanges } from "@/components/admin/form-controls";
import { useEditorBackend, type EditorResult } from "@/components/admin/editor-backend";
import { formatDateTime } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";

type Result = EditorResult;

interface Props<T extends { status: ContentStatus; slug: string }> {
  collection: "services" | "portfolio" | "products";
  id: string | null;
  value: T;
  dirty: boolean;
  onSaved: (v: T) => void;
  onStatus: (s: ContentStatus) => void;
  canPublish: boolean;
  canDelete: boolean;
  publicPrefix: string;
  listHref: string;
  updatedAt?: string | null;
  onFieldErrors: (e: Record<string, string>) => void;
  children: ReactNode;
}

/** Shared save/publish/delete bar and layout for collection editors. */
export function EditorFrame<T extends { status: ContentStatus; slug: string }>({
  collection,
  id,
  value,
  dirty,
  onSaved,
  onStatus,
  canPublish,
  canDelete,
  publicPrefix,
  listHref,
  updatedAt,
  onFieldErrors,
  children,
}: Props<T>) {
  const router = useRouter();
  const backend = useEditorBackend();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  useUnsavedChanges(dirty && !pending);

  const statusOptions = (canPublish ? ["draft", "published", "archived"] : ["draft"]).map((s) => ({ value: s as ContentStatus, label: s[0]!.toUpperCase() + s.slice(1) }));

  const save = () => {
    if (value.status === "published" && !window.confirm("Publish these changes to the live website?")) return;
    start(async () => {
      const res = await backend.save(collection, id, value, updatedAt ?? null);
      setResult(res);
      onFieldErrors(res.ok ? {} : res.fieldErrors ?? {});
      if (res.ok) {
        onSaved(value);
        if (!id && res.data?.id) router.replace(`${listHref}/${res.data.id}`);
        else router.refresh();
      }
    });
  };

  const remove = () =>
    start(async () => {
      if (!id) return;
      const res = await backend.remove(collection, id);
      setResult(res);
      if (res.ok) {
        onSaved(value);
        router.replace(listHref);
      }
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="space-y-4 rounded-2xl border border-line bg-ink-900 p-5">
          <SelectInput label="Status" value={value.status} onChange={onStatus} options={statusOptions} hint={canPublish ? undefined : "Editors save drafts. An admin publishes."} />
          <Button className="w-full" onClick={save} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {value.status === "published" ? "Save & publish" : "Save"}
          </Button>
          {dirty ? <p className="text-xs text-amber-200">You have unsaved changes.</p> : null}
          <FormMessage result={result ? (result.ok ? { ok: true, message: result.message } : { ok: false, error: result.error }) : null} />
          {backend.publishNote ? <p className="text-xs leading-relaxed text-fg-3">{backend.publishNote}</p> : null}
          {id && !backend.previewEnabled && value.status === "published" && !dirty ? (
            <a href={`${publicPrefix}${value.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white">
              View on website <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
          {id && backend.previewEnabled ? (
            <form action="/api/preview" method="GET" target="_blank">
              <input type="hidden" name="path" value={`${publicPrefix}${value.slug}`} />
              <Button type="submit" variant="secondary" className="w-full" size="sm">
                <Eye className="size-4" aria-hidden="true" /> Preview {dirty ? "(last saved)" : ""}
              </Button>
            </form>
          ) : null}
          {updatedAt ? <p className="text-xs text-fg-3">Last updated {formatDateTime(updatedAt)}</p> : null}
        </div>
        {id && canDelete ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
            <p className="mb-3 text-sm text-fg-3">Deleting is permanent. To hide this item without losing it, set status to Archived.</p>
            <ConfirmButton confirmText="Delete this item permanently? This cannot be undone." onConfirm={remove} disabled={pending}>
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </ConfirmButton>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
