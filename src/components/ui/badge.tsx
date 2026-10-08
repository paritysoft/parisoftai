import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "glow" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-white/[0.03] text-fg-2",
  accent: "border-accent/40 bg-accent/10 text-indigo-200",
  glow: "border-glow/30 bg-glow/10 text-cyan-200",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  danger: "border-red-400/30 bg-red-400/10 text-red-200",
};

export function Badge({ children, tone = "neutral", className, mono }: { children: ReactNode; tone?: Tone; className?: string; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium leading-5",
        mono && "font-mono text-[0.72rem] tracking-tight",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
