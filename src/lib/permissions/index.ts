import type { StaffRole } from "@/types/content";

export const ROLE_RANK: Record<StaffRole, number> = { editor: 1, admin: 2, super_admin: 3 };
export const ROLE_LABELS: Record<StaffRole, string> = { editor: "Editor", admin: "Admin", super_admin: "Super Admin" };

/**
 * Minimum role for each capability. Mirrors the database RLS policies, which remain the
 * final authority — this table drives UI visibility and early server-side rejection.
 */
export const PERMISSIONS = {
  "dashboard.view": "editor",
  "content.edit": "editor",
  "content.publish": "admin",
  "content.delete": "admin",
  "media.upload": "editor",
  "media.delete": "admin",
  "leads.view": "admin",
  "leads.manage": "admin",
  "leads.delete": "admin",
  "analytics.view": "admin",
  "seo.manage": "super_admin",
  "settings.manage": "super_admin",
  "users.manage": "super_admin",
  "audit.view": "super_admin",
} as const satisfies Record<string, StaffRole>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSIONS[permission]];
}
