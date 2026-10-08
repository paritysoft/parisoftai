"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Briefcase,
  ExternalLink,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { LogoMark } from "@/components/layout/logo";
import { ADMIN_NAV } from "@/components/admin/nav";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { StaffRole } from "@/types/content";

const ICONS = {
  dashboard: LayoutDashboard,
  pages: FileText,
  services: Briefcase,
  portfolio: FolderKanban,
  products: Package,
  leads: Inbox,
  analytics: BarChart3,
  media: ImageIcon,
  seo: Search,
  users: Users,
  settings: Settings,
  audit: ScrollText,
} as const;

interface ShellProps {
  user: { email: string; fullName: string | null; role: StaffRole };
  unreadLeads: number;
  writeBlocked: boolean;
  children: React.ReactNode;
}

export function AdminShell({ user, unreadLeads, writeBlocked, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map((section) => {
        const items = section.items.filter((i) => can(user.role, i.permission));
        if (items.length === 0) return null;
        return (
          <div key={section.group ?? "root"} className="mb-5">
            {section.group ? <p className="mb-1.5 px-3 text-xs font-medium text-fg-3/80">{section.group}</p> : null}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = ICONS[item.icon as keyof typeof ICONS];
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                        active ? "bg-accent/15 text-fg" : "text-fg-3 hover:bg-white/[0.04] hover:text-fg",
                      )}
                    >
                      <Icon className={cn("size-4", active && "text-indigo-300")} aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/admin/leads" && unreadLeads > 0 ? (
                        <span className="rounded-full bg-accent px-1.5 text-[0.7rem] font-semibold text-white" aria-label={`${unreadLeads} unread`}>
                          {unreadLeads}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const userBox = (
    <div className="border-t border-line p-3">
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-fg">{user.fullName || user.email}</p>
        <p className="truncate text-xs text-fg-3">{ROLE_LABELS[user.role]}</p>
      </div>
      <form action={signOutAction}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-fg-3 hover:bg-white/[0.04] hover:text-fg">
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#0b1120] lg:grid lg:grid-cols-[248px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-ink-950 lg:flex">
        <Link href="/admin" className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <LogoMark className="size-7" />
          <span className="font-display text-sm font-bold text-fg">ParitySoft AI</span>
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[0.65rem] text-fg-3">Admin</span>
        </Link>
        {nav}
        {userBox}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink-950 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="flex items-center gap-2">
                <LogoMark className="size-7" />
                <span className="font-display text-sm font-bold">Admin</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-lg hover:bg-white/5" aria-label="Close navigation" autoFocus>
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
            {userBox}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-ink-950/85 px-4 backdrop-blur lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="flex size-10 items-center justify-center rounded-lg hover:bg-white/5 lg:hidden" aria-label="Open navigation" aria-expanded={open}>
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="flex-1" />
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-fg-3 hover:bg-white/5 hover:text-fg">
            View website <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </header>
        {writeBlocked ? (
          <div role="alert" className="border-b border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100 lg:px-8">
            Read-only: this non-production deployment is connected to the production database, so changes are blocked.
          </div>
        ) : null}
        <main id="admin-main" className="mx-auto w-full max-w-[1400px] px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
