"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, FolderKanban, LayoutDashboard, LogOut, Menu, Package, X } from "lucide-react";
import { cmsLogoutAction } from "@/actions/cms";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Products", href: "/admin/products", icon: Package },
];

export function CmsShell({ email, banner, children }: { email: string; banner?: React.ReactNode; children: React.ReactNode }) {
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
      <ul className="space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors", active ? "bg-accent/15 text-fg" : "text-fg-3 hover:bg-white/[0.04] hover:text-fg")}
              >
                <Icon className={cn("size-4", active && "text-indigo-300")} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
  const userBox = (
    <div className="border-t border-line p-3">
      <p className="truncate px-3 py-2 text-sm text-fg-2">{email}</p>
      <form action={cmsLogoutAction}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-fg-3 hover:bg-white/[0.04] hover:text-fg">
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#0b1120] lg:grid lg:grid-cols-[232px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-ink-950 lg:flex">
        <Link href="/admin" className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <LogoMark className="size-7" />
          <span className="font-display text-sm font-bold text-fg">ParitySoft AI</span>
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[0.65rem] text-fg-3">Admin</span>
        </Link>
        {nav}
        {userBox}
      </aside>
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
        {banner}
        <main id="admin-main" className="mx-auto w-full max-w-[1400px] px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
