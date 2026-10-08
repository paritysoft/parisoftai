"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import type { FAQItem, LinkItem, TitledItem } from "@/types/content";

export const inputCls =
  "block w-full rounded-[10px] border border-line bg-ink-950 px-3 text-sm text-fg placeholder:text-fg-3/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60";

export function Field({ label, hint, error, children, htmlFor, required, className }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
        {required ? <span className="text-fg-3"> *</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-fg-3">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ label, value, onChange, hint, error, required, type = "text", placeholder, maxLength, disabled, className }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={maxLength ? `${hint ? `${hint} ` : ""}${value.length}/${maxLength}` : hint} error={error} htmlFor={id} required={required} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={!!error}
        className={cn(inputCls, "h-10", error && "border-red-400/70")}
      />
    </Field>
  );
}

export function TextArea({ label, value, onChange, hint, error, rows = 4, required, maxLength, className }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  rows?: number;
  required?: boolean;
  maxLength?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={maxLength ? `${hint ? `${hint} ` : ""}${value.length}/${maxLength}` : hint} error={error} htmlFor={id} required={required} className={className}>
      <textarea id={id} value={value} rows={rows} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} className={cn(inputCls, "resize-y py-2", error && "border-red-400/70")} />
    </Field>
  );
}

export function SelectInput<T extends string>({ label, value, onChange, options, hint, className }: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={cn(inputCls, "h-10")}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange, hint, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-50", checked ? "border-accent bg-accent" : "border-line bg-ink-700")}
      >
        <span className={cn("absolute left-0 top-0.5 size-[18px] rounded-full bg-white transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
        <span className="sr-only">{label}</span>
      </button>
      <label htmlFor={id} className="text-sm">
        <span className="font-medium text-fg">{label}</span>
        {hint ? <span className="block text-xs text-fg-3">{hint}</span> : null}
      </label>
    </div>
  );
}

export function CheckboxGroup<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <label key={o.value} className={cn("flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm", checked ? "border-accent bg-accent/10 text-fg" : "border-line text-fg-3")}>
              <input type="checkbox" className="accent-[var(--color-accent)]" checked={checked} onChange={() => onChange(checked ? value.filter((v) => v !== o.value) : [...value, o.value])} />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ----------------------------- List editors ----------------------------- */

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function RowControls({ index, length, onMove, onRemove, label }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className="flex size-8 items-center justify-center rounded-md text-fg-3 hover:bg-white/5 hover:text-fg disabled:opacity-30" onClick={() => onMove(index - 1)} disabled={index === 0} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className="flex size-8 items-center justify-center rounded-md text-fg-3 hover:bg-white/5 hover:text-fg disabled:opacity-30" onClick={() => onMove(index + 1)} disabled={index === length - 1} aria-label={`Move ${label} down`}>
        <ArrowDown className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className="flex size-8 items-center justify-center rounded-md text-fg-3 hover:bg-red-500/10 hover:text-red-300" onClick={onRemove} aria-label={`Remove ${label}`}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function StringListEditor({ label, value, onChange, placeholder, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; hint?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-fg">{label}</legend>
      {hint ? <p className="mb-2 text-xs text-fg-3">{hint}</p> : null}
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input aria-label={`${label} ${i + 1}`} value={item} placeholder={placeholder} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} className={cn(inputCls, "h-10 flex-1")} />
            <RowControls index={i} length={value.length} label={`item ${i + 1}`} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...value, ""])}>
        <Plus className="size-4" aria-hidden="true" /> Add
      </Button>
    </fieldset>
  );
}

/** Comma/Enter-separated tag input (technologies, etc.) */
export function TagInput({ label, value, onChange, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const commit = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange(Array.from(new Set([...value, ...parts])));
    setDraft("");
  };
  return (
    <Field label={label} hint={hint ?? "Press Enter or comma to add."} htmlFor={id}>
      <div className={cn(inputCls, "flex min-h-10 flex-wrap items-center gap-1.5 py-1.5")}>
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-ink-700 px-2 py-0.5 text-xs text-fg">
            {t}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Remove ${t}`} className="text-fg-3 hover:text-fg">
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={commit}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
        />
      </div>
    </Field>
  );
}

export function TitledListEditor({ label, value, onChange, itemLabel = "item" }: { label: string; value: TitledItem[]; onChange: (v: TitledItem[]) => void; itemLabel?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{label}</legend>
      <ul className="space-y-3">
        {value.map((item, i) => (
          <li key={i} className="rounded-xl border border-line bg-ink-950/50 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input aria-label={`${itemLabel} ${i + 1} title`} placeholder="Title" value={item.title} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, title: e.target.value } : v)))} className={cn(inputCls, "h-10")} />
                <textarea aria-label={`${itemLabel} ${i + 1} description`} placeholder="Description" rows={2} value={item.description} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, description: e.target.value } : v)))} className={cn(inputCls, "py-2")} />
              </div>
              <RowControls index={i} length={value.length} label={`${itemLabel} ${i + 1}`} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...value, { title: "", description: "" }])}>
        <Plus className="size-4" aria-hidden="true" /> Add {itemLabel}
      </Button>
    </fieldset>
  );
}

export function FaqEditor({ value, onChange, label = "FAQ" }: { value: FAQItem[]; onChange: (v: FAQItem[]) => void; label?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{label}</legend>
      <ul className="space-y-3">
        {value.map((item, i) => (
          <li key={i} className="rounded-xl border border-line bg-ink-950/50 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input aria-label={`Question ${i + 1}`} placeholder="Question" value={item.question} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, question: e.target.value } : v)))} className={cn(inputCls, "h-10")} />
                <textarea aria-label={`Answer ${i + 1}`} placeholder="Answer" rows={3} value={item.answer} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, answer: e.target.value } : v)))} className={cn(inputCls, "py-2")} />
              </div>
              <RowControls index={i} length={value.length} label={`question ${i + 1}`} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
            </div>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...value, { question: "", answer: "" }])}>
        <Plus className="size-4" aria-hidden="true" /> Add question
      </Button>
    </fieldset>
  );
}

export function LinkListEditor({ label, value, onChange }: { label: string; value: LinkItem[]; onChange: (v: LinkItem[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{label}</legend>
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input aria-label={`Link ${i + 1} label`} placeholder="Label" value={item.label} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)))} className={cn(inputCls, "h-10 sm:w-48")} />
            <input aria-label={`Link ${i + 1} URL`} placeholder="https://" value={item.url} onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, url: e.target.value } : v)))} className={cn(inputCls, "h-10 flex-1")} />
            <RowControls index={i} length={value.length} label={`link ${i + 1}`} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange([...value, { label: "", url: "" }])}>
        <Plus className="size-4" aria-hidden="true" /> Add link
      </Button>
    </fieldset>
  );
}

export function MarkdownField({ label, value, onChange, rows = 10, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        <div role="tablist" aria-label={`${label} mode`} className="flex rounded-lg border border-line p-0.5 text-xs">
          {(["write", "preview"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("rounded-md px-2.5 py-1 capitalize", tab === t ? "bg-ink-700 text-fg" : "text-fg-3")}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === "write" ? (
        <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "resize-y py-2 font-mono text-[0.8125rem] leading-relaxed")} />
      ) : (
        <div className="min-h-32 rounded-[10px] border border-line bg-ink-950 p-4">{value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-fg-3">Nothing to preview.</p>}</div>
      )}
      <p className="mt-1 text-xs text-fg-3">{hint ?? "Markdown supported: ## headings, **bold**, lists, [links](https://…). HTML is not rendered."}</p>
    </div>
  );
}

/* --------------------------- Feedback & guards --------------------------- */

export function FormMessage({ result }: { result: { ok: boolean; message?: string; error?: string } | null }) {
  if (!result) return <div aria-live="polite" />;
  return (
    <div aria-live="polite">
      <p role={result.ok ? "status" : "alert"} className={cn("rounded-lg border px-3 py-2 text-sm", result.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100")}>
        {result.ok ? result.message ?? "Saved." : result.error}
      </p>
    </div>
  );
}

/** Warn before leaving the page with unsaved changes. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || e.defaultPrevented) return;
      if (!window.confirm("You have unsaved changes. Leave this page and discard them?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/** Track whether a value differs from its last-saved snapshot. */
export function useDirty<T>(value: T) {
  const [saved, setSaved] = useState(() => JSON.stringify(value));
  return {
    dirty: JSON.stringify(value) !== saved,
    markSaved: (v: T) => setSaved(JSON.stringify(v)),
  };
}

export function ConfirmButton({ children, confirmText, onConfirm, variant = "danger", disabled, size = "sm", className }: { children: ReactNode; confirmText: string; onConfirm: () => void; variant?: "danger" | "primary" | "secondary"; disabled?: boolean; size?: "sm" | "md"; className?: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <>
      <Button variant={variant} size={size} disabled={disabled} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <dialog ref={dialogRef} aria-labelledby={titleId} onClose={() => setOpen(false)} className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-ink-900 p-0 text-fg backdrop:bg-black/60">
        <div className="p-6">
          <p id={titleId} className="text-[0.9375rem] leading-relaxed text-fg">
            {confirmText}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} autoFocus>
              Cancel
            </Button>
            <Button
              variant={variant}
              size="sm"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
