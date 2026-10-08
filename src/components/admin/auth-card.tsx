import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main id="main" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="dot-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
        <div className="absolute left-1/2 top-0 h-[50vh] w-[60vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_25%,transparent),transparent)] blur-2xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mx-auto mb-8 flex w-fit rounded-lg" aria-label="Back to website">
          <Logo />
        </Link>
        <div className="surface p-7">
          <h1 className="text-xl font-bold text-fg">{title}</h1>
          {description ? <p className="mt-1.5 text-sm text-fg-3">{description}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
