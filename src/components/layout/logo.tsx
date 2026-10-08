import { cn } from "@/lib/utils";

/** ParitySoft AI mark: two equal, offset bars — the same product, balanced across platforms. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="psai-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-accent-2)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#psai-g)" />
      <rect x="7" y="9.5" width="13" height="4.5" rx="2.25" fill="#fff" />
      <rect x="12" y="18" width="13" height="4.5" rx="2.25" fill="#fff" fillOpacity="0.85" />
      <circle cx="24.5" cy="11.75" r="1.6" fill="var(--color-glow)" />
    </svg>
  );
}

export function Logo({ name = "ParitySoft AI", logoUrl, className }: { name?: string; logoUrl?: string; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-provided logo of unknown dimensions
        <img src={logoUrl} alt="" className="h-8 w-auto" />
      ) : (
        <LogoMark />
      )}
      <span className="font-display text-[1.05rem] font-bold tracking-tight text-fg">{name}</span>
    </span>
  );
}
