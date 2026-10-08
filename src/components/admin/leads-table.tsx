"use client";

import Link from "next/link";
import { useState } from "react";
import { Download } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { EmptyRow, LeadStatusBadge, Table, td, th } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";
import type { LeadStatus } from "@/types/content";

export interface LeadRow {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  service: string;
  status: LeadStatus;
  isRead: boolean;
  createdAt: string;
  notification: string;
}

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const all = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <a
          href={`/api/admin/leads/export${selected.length ? `?ids=${selected.join(",")}` : ""}`}
          className={buttonClasses("secondary", "sm")}
          aria-label={selected.length ? `Export ${selected.length} selected leads as CSV` : "Export all leads as CSV"}
        >
          <Download className="size-4" aria-hidden="true" /> {selected.length ? `Export ${selected.length} selected` : "Export all"} (CSV)
        </a>
        {selected.length ? (
          <button type="button" className="text-sm text-fg-3 hover:text-fg" onClick={() => setSelected([])}>
            Clear selection
          </button>
        ) : null}
      </div>
      <Table caption="Leads">
        <thead>
          <tr>
            <th className={th}>
              <input type="checkbox" aria-label="Select all leads on this page" checked={all} onChange={() => setSelected(all ? [] : rows.map((r) => r.id))} className="accent-[var(--color-accent)]" />
            </th>
            <th className={th}>Contact</th>
            <th className={th}>Service</th>
            <th className={th}>Status</th>
            <th className={th}>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5}>No inquiries match these filters.</EmptyRow>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02]">
                <td className={td}>
                  <input type="checkbox" aria-label={`Select ${r.fullName}`} checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="accent-[var(--color-accent)]" />
                </td>
                <td className={td}>
                  <Link href={`/admin/leads/${r.id}`} className="flex items-center gap-2 font-medium text-fg hover:text-indigo-200">
                    {!r.isRead ? <span className="size-2 rounded-full bg-accent" aria-label="Unread" /> : null}
                    {r.fullName}
                  </Link>
                  <span className="block text-xs text-fg-3">
                    {r.email}
                    {r.company ? ` · ${r.company}` : ""}
                  </span>
                </td>
                <td className={td}>{r.service}</td>
                <td className={td}>
                  <span className="flex items-center gap-2">
                    <LeadStatusBadge status={r.status} />
                    {r.notification === "failed" ? <span className="text-xs text-red-300">Email failed</span> : null}
                  </span>
                </td>
                <td className={td}>{formatDateTime(r.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
