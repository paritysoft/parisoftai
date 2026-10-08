"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteUserAction, setUserActiveAction, setUserRoleAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, Table, td, th } from "@/components/admin/ui";
import { ConfirmButton, FormMessage, SelectInput, TextInput, inputCls } from "@/components/admin/form-controls";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate, cn } from "@/lib/utils";
import { STAFF_ROLES, type StaffRole } from "@/types/content";

export interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole | null;
  isActive: boolean;
  createdAt: string;
}

type Res = { ok: boolean; message?: string; error?: string };

export function UsersManager({ users, currentUserId, roles }: { users: UserRow[]; currentUserId: string; roles: { role: StaffRole; description: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Res | null>(null);
  const [invite, setInvite] = useState({ email: "", fullName: "", role: "editor" as StaffRole });
  const run = (fn: () => Promise<Res>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  const roleOptions = STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

  return (
    <div className="space-y-6">
      <FormMessage result={result} />
      <Table caption="Admin users">
        <thead>
          <tr>
            <th className={th}>User</th>
            <th className={th}>Role</th>
            <th className={th}>Status</th>
            <th className={th}>Added</th>
            <th className={th}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className={td}>
                <span className="font-medium text-fg">{u.fullName || u.email}</span>
                <span className="block text-xs text-fg-3">{u.email}</span>
              </td>
              <td className={td}>
                <label className="sr-only" htmlFor={`role-${u.id}`}>
                  Role for {u.email}
                </label>
                <select
                  id={`role-${u.id}`}
                  value={u.role ?? ""}
                  disabled={pending}
                  onChange={(e) => run(() => setUserRoleAction(u.id, e.target.value))}
                  className={cn(inputCls, "h-9 w-40")}
                >
                  {!u.role ? <option value="">No access</option> : null}
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className={td}>{u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}</td>
              <td className={td}>{formatDate(u.createdAt)}</td>
              <td className={td}>
                {u.id === currentUserId ? (
                  <span className="text-xs text-fg-3">You</span>
                ) : u.isActive ? (
                  <ConfirmButton variant="secondary" confirmText={`Deactivate ${u.email}? They will immediately lose admin access.`} onConfirm={() => run(() => setUserActiveAction(u.id, false))}>
                    Deactivate
                  </ConfirmButton>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => run(() => setUserActiveAction(u.id, true))}>
                    Reactivate
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Invite a user" description="They receive an email to set a password. There is no public sign-up.">
          <div className="space-y-4">
            <TextInput label="Email" type="email" value={invite.email} onChange={(v) => setInvite({ ...invite, email: v })} />
            <TextInput label="Full name" value={invite.fullName} onChange={(v) => setInvite({ ...invite, fullName: v })} />
            <SelectInput label="Role" value={invite.role} onChange={(v) => setInvite({ ...invite, role: v })} options={roleOptions} />
            <Button disabled={pending || !invite.email} onClick={() => run(() => inviteUserAction(invite), () => setInvite({ email: "", fullName: "", role: "editor" }))}>
              Send invitation
            </Button>
          </div>
        </Card>
        <Card title="Roles">
          <dl className="space-y-3 text-sm">
            {roles.map((r) => (
              <div key={r.role}>
                <dt className="font-medium text-fg">{ROLE_LABELS[r.role]}</dt>
                <dd className="text-fg-3">{r.description}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
