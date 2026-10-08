"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, RefreshCw, Trash2 } from "lucide-react";
import { addLeadNoteAction, deleteLeadAction, retryLeadNotificationAction, updateLeadAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { ConfirmButton, FormMessage, SelectInput, TextArea } from "@/components/admin/form-controls";
import { Card } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/utils";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/types/content";

type Res = { ok: boolean; message?: string; error?: string };

export function LeadControls({
  id,
  email,
  status,
  assignedTo,
  staff,
  notification,
  canDelete,
}: {
  id: string;
  email: string;
  status: LeadStatus;
  assignedTo: string | null;
  staff: { id: string; name: string }[];
  notification: { status: string; attempts: number; error: string | null };
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Res | null>(null);
  const run = (fn: () => Promise<Res>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="space-y-4">
      <Card title="Manage">
        <div className="space-y-4">
          <SelectInput label="Status" value={status} onChange={(s) => run(() => updateLeadAction(id, { status: s }))} options={LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] }))} />
          <SelectInput
            label="Assigned to"
            value={assignedTo ?? ""}
            onChange={(a) => run(() => updateLeadAction(id, { assignedTo: a || null }))}
            options={[{ value: "", label: "Unassigned" }, ...staff.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-sm text-indigo-200 hover:text-white">
            <Mail className="size-4" aria-hidden="true" /> Reply by email
          </a>
          <Button variant="ghost" size="sm" onClick={() => run(() => updateLeadAction(id, { isRead: false }))}>
            Mark as unread
          </Button>
          {pending ? <Loader2 className="size-4 animate-spin text-fg-3" aria-label="Saving" /> : null}
          <FormMessage result={result} />
        </div>
      </Card>
      <Card title="Email notification">
        <p className="text-sm text-fg-2">
          Status: <strong className="text-fg">{notification.status}</strong> ({notification.attempts} attempt{notification.attempts === 1 ? "" : "s"})
        </p>
        {notification.error ? <p className="mt-2 break-words text-xs text-red-300">{notification.error}</p> : null}
        {notification.status !== "sent" ? (
          <Button variant="secondary" size="sm" className="mt-3" disabled={pending} onClick={() => run(() => retryLeadNotificationAction(id))}>
            <RefreshCw className="size-4" aria-hidden="true" /> Retry notification
          </Button>
        ) : null}
      </Card>
      {canDelete ? (
        <ConfirmButton confirmText="Delete this lead and its notes permanently?" onConfirm={() => run(() => deleteLeadAction(id), () => router.replace("/admin/leads"))}>
          <Trash2 className="size-4" aria-hidden="true" /> Delete lead
        </ConfirmButton>
      ) : null}
    </div>
  );
}

export function LeadNotes({ id, notes }: { id: string; notes: { id: string; body: string; author: string; createdAt: string }[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Res | null>(null);
  return (
    <Card title="Internal notes" description="Visible only to admins.">
      <ul className="space-y-3">
        {notes.length === 0 ? <li className="text-sm text-fg-3">No notes yet.</li> : null}
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl border border-line bg-ink-950/50 p-3">
            <p className="whitespace-pre-wrap text-sm text-fg-2">{n.body}</p>
            <p className="mt-2 text-xs text-fg-3">
              {n.author} · {formatDateTime(n.createdAt)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2">
        <TextArea label="Add a note" value={body} onChange={setBody} rows={3} maxLength={4000} />
        <Button
          size="sm"
          disabled={pending || !body.trim()}
          onClick={() =>
            start(async () => {
              const r = await addLeadNoteAction(id, body);
              setResult(r);
              if (r.ok) {
                setBody("");
                router.refresh();
              }
            })
          }
        >
          Add note
        </Button>
        <FormMessage result={result} />
      </div>
    </Card>
  );
}
