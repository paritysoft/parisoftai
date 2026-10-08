"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Search, Upload, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { listMediaAction, registerMediaAction, type MediaAsset } from "@/actions/media";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES, storagePathFor, type AllowedMime } from "@/lib/media/validate";
import { Button } from "@/components/ui/button";
import { Field, inputCls } from "@/components/admin/form-controls";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/types/content";

function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Upload directly from the browser to Supabase Storage, then ask the server to verify and register it. */
export async function uploadImage(file: File, altText = ""): Promise<{ ok: true; asset: MediaAsset } | { ok: false; error: string }> {
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) return { ok: false, error: `${file.name}: unsupported type. Use PNG, JPEG, WebP, AVIF or SVG.` };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name}: larger than 5 MB.` };
  const path = storagePathFor(file.name, file.type as AllowedMime, crypto.randomUUID());
  const dims = file.type === "image/svg+xml" ? { width: null, height: null } : await readDimensions(file);
  const supabase = createBrowserSupabase();
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (error) return { ok: false, error: `${file.name}: upload failed (${error.message}).` };
  const res = await registerMediaAction({ path, fileName: file.name, altText, ...dims });
  if (!res.ok) return { ok: false, error: `${file.name}: ${res.error}` };
  return { ok: true, asset: res.data! };
}

export function UploadButton({ onUploaded, multiple = true, label = "Upload images" }: { onUploaded: (assets: MediaAsset[]) => void; multiple?: boolean; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErrors([]);
    const done: MediaAsset[] = [];
    const errs: string[] = [];
    for (const f of Array.from(files)) {
      const r = await uploadImage(f);
      if (r.ok) done.push(r.asset);
      else errs.push(r.error);
    }
    setBusy(false);
    setErrors(errs);
    if (inputRef.current) inputRef.current.value = "";
    if (done.length) onUploaded(done);
  };
  return (
    <div>
      <input ref={inputRef} type="file" accept={ALLOWED_MIME.join(",")} multiple={multiple} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFiles(e.target.files)} />
      <Button variant="primary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {busy ? "Uploading…" : label}
      </Button>
      {errors.length > 0 ? (
        <ul role="alert" className="mt-2 space-y-1 text-xs text-red-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MediaPickerDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (asset: MediaAsset) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await listMediaAction(q);
    setLoading(false);
    if (res.ok) {
      setItems(res.data ?? []);
      setError(null);
    } else setError(res.error);
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
       
      void load("");
    }
    if (!open && d.open) d.close();
  }, [open, load]);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={titleId} className="m-auto w-[min(96vw,900px)] rounded-2xl border border-line bg-ink-900 p-0 text-fg backdrop:bg-black/70">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 id={titleId} className="font-semibold">Choose an image</h2>
        <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg hover:bg-white/5" aria-label="Close">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col gap-3 border-b border-line px-5 py-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
          }}
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or alt text" aria-label="Search media" className={cn(inputCls, "h-10 pl-9")} />
        </form>
        <UploadButton onUploaded={(assets) => setItems((prev) => [...assets, ...prev])} />
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-5">
        {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
        {loading ? <p className="text-sm text-fg-3">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="text-sm text-fg-3">No images yet. Upload one to get started.</p> : null}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(a);
                  onClose();
                }}
                className="group block w-full overflow-hidden rounded-xl border border-line text-left hover:border-accent focus-visible:border-accent"
              >
                <span className="block aspect-square bg-ink-950">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  <img src={a.publicUrl} alt={a.altText} loading="lazy" className="size-full object-contain" />
                </span>
                <span className="block truncate px-2 py-1.5 text-xs text-fg-3 group-hover:text-fg">{a.fileName}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}

/** URL field with a "choose from library" button and a thumbnail preview. */
export function MediaField({ label, value, onChange, hint }: { label: string; value: string; onChange: (url: string, asset?: MediaAsset) => void; hint?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Field label={label} hint={hint ?? "Choose from the media library or paste an https:// URL."} htmlFor={id}>
      <div className="flex items-start gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink-950">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={value} alt="" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-5 text-fg-3" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className={cn(inputCls, "h-10 flex-1")} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="h-10" onClick={() => setOpen(true)}>
              Library
            </Button>
            {value ? (
              <Button variant="ghost" size="sm" className="h-10" onClick={() => onChange("")} aria-label={`Clear ${label}`}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onSelect={(a) => onChange(a.publicUrl, a)} />
    </Field>
  );
}

export function GalleryEditor({ label, value, onChange }: { label: string; value: GalleryImage[]; onChange: (v: GalleryImage[]) => void }) {
  const [open, setOpen] = useState(false);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x!);
    onChange(next);
  };
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{label}</legend>
      {value.length === 0 ? <p className="mb-2 text-sm text-fg-3">No images yet.</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {value.map((img, i) => (
          <li key={`${img.url}-${i}`} className="rounded-xl border border-line bg-ink-950/50 p-2">
            <div className="aspect-video overflow-hidden rounded-lg bg-ink-950">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={img.url} alt="" className="size-full object-contain" />
            </div>
            <input aria-label={`Alt text for image ${i + 1}`} placeholder="Alt text (describe the image)" value={img.alt} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, alt: e.target.value } : v)))} className={cn(inputCls, "mt-2 h-9")} />
            <div className="mt-2 flex justify-between gap-1 text-xs">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>
                  ←
                </Button>
                <Button variant="ghost" size="sm" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Move image ${i + 1} later`}>
                  →
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove image ${i + 1}`}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <ImagePlus className="size-4" aria-hidden="true" /> Add image
      </Button>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onSelect={(a) => onChange([...value, { url: a.publicUrl, alt: a.altText }])} />
    </fieldset>
  );
}
