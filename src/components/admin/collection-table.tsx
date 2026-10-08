"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import { reorderItemsAction } from "@/actions/content";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/admin/form-controls";
import { EmptyRow, StatusBadge, Table, td, th } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";

export interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  status: ContentStatus;
  featured?: boolean;
  meta?: string;
  updatedAt: string;
}

export function CollectionTable({ collection, rows, basePath, canReorder, emptyText }: { collection: "services" | "portfolio" | "products"; rows: CollectionRow[]; basePath: string; canReorder: boolean; emptyText: string }) {
  const [items, setItems] = useState(rows);
  const [changed, setChanged] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);

  const move = (i: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x!);
    setItems(next);
    setChanged(true);
  };

  return (
    <div>
      {canReorder && changed ? (
        <div className="mb-3 flex items-center gap-3">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await reorderItemsAction(collection, items.map((x) => x.id));
                setResult(r.ok ? { ok: true, message: r.message } : { ok: false, error: r.error });
                if (r.ok) setChanged(false);
              })
            }
          >
            Save order
          </Button>
          <span className="text-sm text-fg-3">Order changed — save to apply on the website.</span>
        </div>
      ) : null}
      {result ? (
        <div className="mb-3">
          <FormMessage result={result} />
        </div>
      ) : null}
      <Table caption={`${collection} list`}>
        <thead>
          <tr>
            {canReorder ? <th className={th}><span className="sr-only">Order</span></th> : null}
            <th className={th}>Name</th>
            <th className={th}>Status</th>
            <th className={th}>Details</th>
            <th className={th}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={canReorder ? 5 : 4}>{emptyText}</EmptyRow>
          ) : (
            items.map((r, i) => (
              <tr key={r.id} className="hover:bg-white/[0.02]">
                {canReorder ? (
                  <td className={td}>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded p-1 text-fg-3 hover:text-fg disabled:opacity-30" aria-label={`Move ${r.name} up`}>
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} className="rounded p-1 text-fg-3 hover:text-fg disabled:opacity-30" aria-label={`Move ${r.name} down`}>
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                ) : null}
                <td className={td}>
                  <Link href={`${basePath}/${r.id}`} className="font-medium text-fg hover:text-indigo-200">
                    {r.name}
                  </Link>
                  <span className="block text-xs text-fg-3">/{r.slug}</span>
                </td>
                <td className={td}>
                  <StatusBadge status={r.status} />
                </td>
                <td className={td}>
                  <span className="flex items-center gap-2 text-xs">
                    {r.featured ? (
                      <span className="inline-flex items-center gap-1 text-amber-200">
                        <Star className="size-3.5" aria-hidden="true" /> Featured
                      </span>
                    ) : null}
                    {r.meta}
                  </span>
                </td>
                <td className={td}>{formatDate(r.updatedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
