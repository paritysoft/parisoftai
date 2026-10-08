import type { Permission } from "@/lib/permissions";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
}

export const ADMIN_NAV: { group: string | null; items: AdminNavItem[] }[] = [
  { group: null, items: [{ label: "Dashboard", href: "/admin", icon: "dashboard", permission: "dashboard.view" }] },
  {
    group: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: "pages", permission: "content.edit" },
      { label: "Services", href: "/admin/services", icon: "services", permission: "content.edit" },
      { label: "Portfolio", href: "/admin/portfolio", icon: "portfolio", permission: "content.edit" },
      { label: "Products", href: "/admin/products", icon: "products", permission: "content.edit" },
    ],
  },
  {
    group: "Business",
    items: [
      { label: "Leads", href: "/admin/leads", icon: "leads", permission: "leads.view" },
      { label: "Analytics", href: "/admin/analytics", icon: "analytics", permission: "analytics.view" },
    ],
  },
  {
    group: "Management",
    items: [
      { label: "Media Library", href: "/admin/media", icon: "media", permission: "media.upload" },
      { label: "SEO", href: "/admin/seo", icon: "seo", permission: "seo.manage" },
      { label: "Users", href: "/admin/users", icon: "users", permission: "users.manage" },
      { label: "Settings", href: "/admin/settings", icon: "settings", permission: "settings.manage" },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: "audit", permission: "audit.view" },
    ],
  },
];
