"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Search, Trash2 } from "lucide-react";
import { deleteMediaAction, mediaUsageAction, updateMediaAction, type MediaAsset } from "@/actions/media";
import { UploadButton } from "@/components/admin/media";
import { ConfirmButton, FormMessage, TextInput, inputCls } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

type Res = { ok: boolean; message?: string; error?: string };

export function MediaLibrary({ initial, canDelete, query }: { initial: MediaAsset[]; canDelete: boolean; query: string }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<MediaAsset | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <form method="GET" role="search" className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <input name="q" defaultValue={query} aria-label="Search media" placeholder="Search by name or alt text" className={cn(inputCls, "h-10 pl-9")} />
          </form>
          <UploadButton
            onUploaded={(assets) => {
              setItems((p) => [...assets, ...p]);
              setSelected(assets[0] ?? null);
            }}
          />
        </div>
        <p className="mb-3 text-xs text-fg-3">PNG, JPEG, WebP or AVIF up to 5 MB. SVG is limited to admins and rejected if it contains scripts. Prefer WebP or AVIF for website images.</p>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-fg-3">{query ? "No images match your search." : "No images yet. Upload your first image."}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a)}
                  aria-pressed={selected?.id === a.id}
                  className={cn("block w-full overflow-hidden rounded-xl border text-left", selected?.id === a.id ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-line-strong")}
                >
                  <span className="block aspect-square bg-ink-950">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img src={a.publicUrl} alt={a.altText} loading="lazy" className="size-full object-contain" />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs text-fg-3">{a.fileName}</span>
                  {!a.altText ? <span className="block px-2 pb-1.5 text-[0.7rem] text-amber-200">Missing alt text</span> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {selected ? (
          <MediaDetails
            key={selected.id}
            asset={selected}
            canDelete={canDelete}
            onChange={(a) => {
              setItems((p) => p.map((x) => (x.id === a.id ? a : x)));
              setSelected(a);
            }}
            onDeleted={(id) => {
              setItems((p) => p.filter((x) => x.id !== id));
              setSelected(null);
              router.refresh();
            }}
          />
        ) : (
          <p className="rounded-2xl border border-line bg-ink-900 p-5 text-sm text-fg-3">Select an image to edit its details.</p>
        )}
      </aside>
    </div>
  );
}

function MediaDetails({ asset, canDelete, onChange, onDeleted }: { asset: MediaAsset; canDelete: boolean; onChange: (a: MediaAsset) => void; onDeleted: (id: string) => void }) {
  const [alt, setAlt] = useState(asset.altText);
  const [title, setTitle] = useState(asset.title ?? "");
  const [usage, setUsage] = useState<string[] | null>(null);
  const [result, setResult] = useState<Res | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-ink-900 p-5">
      <div className="aspect-video overflow-hidden rounded-lg bg-ink-950">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
        <img src={asset.publicUrl} alt={asset.altText} className="size-full object-contain" />
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <dt className="text-fg-3">Type</dt>
        <dd className="text-fg-2">{asset.mimeType.replace("image/", "").toUpperCase()}</dd>
        <dt className="text-fg-3">Size</dt>
        <dd className="text-fg-2">{(asset.sizeBytes / 1024).toFixed(0)} KB</dd>
        {asset.width ? (
          <>
            <dt className="text-fg-3">Dimensions</dt>
            <dd className="text-fg-2">
              {asset.width}×{asset.height}
            </dd>
          </>
        ) : null}
        <dt className="text-fg-3">Uploaded</dt>
        <dd className="text-fg-2">{formatDate(asset.createdAt)}</dd>
      </dl>
      <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(asset.publicUrl).then(() => setResult({ ok: true, message: "URL copied." }))}>
        <Copy className="size-4" aria-hidden="true" /> Copy URL
      </Button>
      <TextInput label="Alt text" value={alt} onChange={setAlt} maxLength={200} hint="Describe the image for people who can't see it." />
      <TextInput label="Title" value={title} onChange={setTitle} maxLength={120} />
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await updateMediaAction(asset.id, { altText: alt, title });
            setResult(r);
            if (r.ok) onChange({ ...asset, altText: alt, title: title || null });
          })
        }
      >
        Save details
      </Button>
      <div className="border-t border-line pt-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await mediaUsageAction(asset.publicUrl);
              if (r.ok) setUsage(r.data?.where ?? []);
              else setResult(r);
            })
          }
        >
          Check where it&apos;s used
        </Button>
        {usage ? (
          usage.length ? (
            <ul className="mt-2 list-disc pl-5 text-xs text-fg-2">
              {usage.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-fg-3">Not used in any content.</p>
          )
        ) : null}
      </div>
      {canDelete ? (
        <ConfirmButton
          confirmText={usage?.length ? `This image is used in ${usage.length} place(s). Deleting it will break those images. Delete anyway?` : "Delete this image permanently?"}
          onConfirm={() =>
            start(async () => {
              const r = await deleteMediaAction(asset.id);
              setResult(r);
              if (r.ok) onDeleted(asset.id);
            })
          }
        >
          <Trash2 className="size-4" aria-hidden="true" /> Delete
        </ConfirmButton>
      ) : null}
      <FormMessage result={result} />
    </div>
  );
}
