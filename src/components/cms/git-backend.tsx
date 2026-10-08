"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { cmsDeleteAction, cmsSaveAction, cmsUploadAction } from "@/actions/cms";
import { EditorBackendProvider, type EditorBackend, type EditorCollection, type GalleryFieldProps, type ImageFieldProps } from "@/components/admin/editor-backend";
import { Field, inputCls } from "@/components/admin/form-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FileCollection } from "@/lib/content/file-format";

/**
 * Editor backend for the Git-backed admin. Images are uploaded one at a time (each stays under
 * Vercel's request limit) and staged in GitHub; the item save then commits the JSON file and
 * all referenced images together as a single commit.
 */

interface Upload {
  path: string;
  blobSha?: string;
  previewUrl: string;
}
interface UploadsCtx {
  collection: FileCollection;
  uploads: Map<string, Upload>;
  add: (u: Upload) => void;
  previewFor: (url: string) => string;
}
const Ctx = createContext<UploadsCtx | null>(null);
const useUploads = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("GitBackendProvider missing");
  return c;
};

const ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

function useUploader() {
  const { collection, add } = useUploads();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setError(null);
      if (file.size > 3.5 * 1024 * 1024) {
        setError(`${file.name}: larger than 3.5 MB. Export as WebP or compress it first.`);
        return null;
      }
      setBusy(true);
      const fd = new FormData();
      fd.set("file", file);
      fd.set("collection", collection);
      try {
        const res = await cmsUploadAction(fd);
        if (!res.ok || !res.data) {
          setError(`${file.name}: ${res.ok ? "Upload failed." : res.error}`);
          return null;
        }
        add({ path: res.data.path, blobSha: res.data.blobSha, previewUrl: URL.createObjectURL(file) });
        return res.data.path;
      } catch {
        setError(`${file.name}: upload failed. Check your connection and try again.`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [collection, add],
  );
  return { upload, busy, error };
}

function PickButton({ onFiles, multiple, busy, label }: { onFiles: (files: File[]) => void; multiple?: boolean; busy: boolean; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <Button variant="secondary" size="sm" className="h-10" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
        {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}

function GitImageField({ label, value, onChange, hint }: ImageFieldProps) {
  const { previewFor } = useUploads();
  const { upload, busy, error } = useUploader();
  const id = useId();
  return (
    <Field label={label} hint={hint ?? "Upload PNG, JPEG, WebP or AVIF (max 3.5 MB), or paste an https:// URL or /path."} htmlFor={id} error={error ?? undefined}>
      <div className="flex items-start gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink-950">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview (may be a local blob URL)
            <img src={previewFor(value)} alt="" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-5 text-fg-3" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… or https://…" className={cn(inputCls, "h-10 min-w-0 flex-1")} />
          <div className="flex gap-2">
            <PickButton busy={busy} label="Upload" onFiles={async ([f]) => { const p = f ? await upload(f) : null; if (p) onChange(p); }} />
            {value ? (
              <Button variant="ghost" size="sm" className="h-10" onClick={() => onChange("")} aria-label={`Clear ${label}`}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Field>
  );
}

function GitGalleryField({ label, value, onChange }: GalleryFieldProps) {
  const { previewFor } = useUploads();
  const { upload, busy, error } = useUploader();
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
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
      {value.length === 0 ? <p className="mb-2 text-sm text-fg-3">No images yet. Screenshots are optional.</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {value.map((img, i) => (
          <li key={`${img.url}-${i}`} className="rounded-xl border border-line bg-ink-950/50 p-2">
            <div className="aspect-video overflow-hidden rounded-lg bg-ink-950">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={previewFor(img.url)} alt="" className="size-full object-contain" />
            </div>
            <input
              aria-label={`Alt text for image ${i + 1}`}
              placeholder="Alt text (describe the image)"
              value={img.alt}
              maxLength={200}
              onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, alt: e.target.value } : v)))}
              className={cn(inputCls, "mt-2 h-9")}
            />
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
      <div className="mt-3">
        <PickButton
          multiple
          busy={busy}
          label="Add screenshots"
          onFiles={async (files) => {
            for (const f of files) {
              const p = await upload(f);
              if (p) {
                latest.current = [...latest.current, { url: p, alt: "" }];
                onChange(latest.current);
              }
            }
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

const toFileCollection = (c: EditorCollection): FileCollection => {
  if (c === "portfolio") return "projects";
  if (c === "products") return "products";
  throw new Error("Services are edited in code while the Git-backed admin is active.");
};

export function GitBackendProvider({ collection, publishNote, children }: { collection: FileCollection; publishNote: string; children: ReactNode }) {
  const [uploads, setUploads] = useState<Map<string, Upload>>(() => new Map());
  const uploadsRef = useRef(uploads);
  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);
  useEffect(() => () => uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.previewUrl)), []);

  const add = useCallback((u: Upload) => setUploads((m) => new Map(m).set(u.path, u)), []);
  const previewFor = useCallback((url: string) => uploads.get(url)?.previewUrl ?? url, [uploads]);

  const backend = useMemo<EditorBackend>(
    () => ({
      save: (c, id, value, expectedUpdatedAt) =>
        cmsSaveAction(
          toFileCollection(c),
          id,
          value,
          expectedUpdatedAt,
          Array.from(uploadsRef.current.values()).map(({ path, blobSha }) => ({ path, blobSha })),
        ),
      remove: (c, id) => cmsDeleteAction(toFileCollection(c), id),
      ImageField: GitImageField,
      GalleryField: GitGalleryField,
      previewEnabled: false,
      publishNote,
    }),
    [publishNote],
  );

  return (
    <Ctx.Provider value={{ collection, uploads, add, previewFor }}>
      <EditorBackendProvider backend={backend}>{children}</EditorBackendProvider>
    </Ctx.Provider>
  );
}
