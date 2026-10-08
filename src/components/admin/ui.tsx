import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContentStatus, LeadStatus } from "@/types/content";
import { LEAD_STATUS_LABELS } from "@/types/content";

export function AdminPageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm text-fg-3 hover:text-fg">
            <ChevronLeft className="size-4" aria-hidden="true" /> {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
        {description ? <p className="mt-1 text-sm text-fg-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, description, children, className, actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-ink-900", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[0.9375rem] font-semibold text-fg">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-fg-3">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-fg-3">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-fg">{value}</p>
      {hint ? <p className="mt-1 text-xs text-fg-3">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-2xl border border-line bg-ink-900 p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-line-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  const tone = status === "published" ? "success" : status === "draft" ? "warning" : "neutral";
  return <Badge tone={tone}>{status === "published" ? "Published" : status === "draft" ? "Draft" : "Archived"}</Badge>;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const tone = status === "new" ? "accent" : status === "won" ? "success" : status === "lost" ? "neutral" : status === "qualified" || status === "proposal_sent" ? "glow" : "warning";
  return <Badge tone={tone}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

export function Table({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-ink-900">
      <table className="w-full min-w-[640px] text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export const th = "border-b border-line px-4 py-3 text-xs font-medium text-fg-3";
export const td = "border-b border-line/60 px-4 py-3 align-middle text-fg-2";

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-fg-3">
        {children}
      </td>
    </tr>
  );
}

export function Pagination({ page, pageCount, makeHref }: { page: number; pageCount: number; makeHref: (page: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-fg-3">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 hover:text-fg">
            <ChevronLeft className="size-4" aria-hidden="true" /> Previous
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link href={makeHref(page + 1)} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 hover:text-fg">
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function Denied() {
  return (
    <div role="alert" className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
      You don&apos;t have permission to open that page. Ask a super admin if you need access.
    </div>
  );
}
