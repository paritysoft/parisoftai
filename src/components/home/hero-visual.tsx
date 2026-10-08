"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * "Parity" hero visual: the same product running on a desktop window and a phone,
 * with an abstract glass orb behind them. Pure CSS/SVG — no WebGL — so it is light
 * on low-powered devices. Pointer parallax is disabled on touch and reduced motion.
 */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);

  // Pointer parallax: eases CSS variables toward the pointer with a short rAF loop that stops
  // once settled. Fine pointers only; skipped for reduced motion. No animation library needed.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, frame = 0;
    const step = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!frame) frame = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const layer = (dx: number, dy: number): CSSProperties => ({ transform: `translate3d(calc(var(--px, 0) * ${dx}px), calc(var(--py, 0) * ${dy}px), 0)` });

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration of the same application running on a desktop window and a phone"
      className="relative mx-auto aspect-[10/9] w-full max-w-[560px] select-none"
    >
      {/* Orb + orbit ring */}
      <div style={layer(-26, -20)} className="absolute right-[6%] top-[2%] aspect-square w-[46%]" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,#e0e7ff_0%,var(--color-accent-2)_26%,var(--color-accent)_52%,#1e1b4b_78%)] opacity-90 shadow-[0_0_80px_-10px_var(--color-accent-2)]" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_70%_80%,color-mix(in_oklab,var(--color-glow)_55%,transparent),transparent_45%)] mix-blend-screen" />
        <div className="absolute -inset-[22%] motion-safe:animate-[spin_40s_linear_infinite]">
          <div className="absolute inset-0 rounded-full border border-white/15 [transform:rotateX(72deg)_rotateZ(-18deg)]" />
          <div className="absolute left-1/2 top-[4%] size-2.5 -translate-x-1/2 rounded-full bg-glow shadow-[0_0_14px_var(--color-glow)]" />
        </div>
      </div>

      {/* Desktop window */}
      <div
        style={layer(-10, -8)}
        className="absolute bottom-[14%] left-0 w-[82%]"
        aria-hidden="true"
      >
        <div className="motion-safe:animate-float-slow">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/85 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="flex items-center gap-1.5 border-b border-white/5 px-3.5 py-2.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="ml-3 h-2 w-24 rounded-full bg-white/10" />
          </div>
          <div className="grid aspect-[16/9.5] grid-cols-[22%_1fr] gap-3 p-3">
            <div className="space-y-2 rounded-lg bg-white/[0.03] p-2.5">
              <div className="h-2 w-3/4 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2))]" />
              {[70, 55, 62, 48].map((w) => (
                <div key={w} className="h-1.5 rounded-full bg-white/10" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
                    <div className="h-1.5 w-1/2 rounded-full bg-white/15" />
                    <div className={`mt-2 h-2.5 w-3/4 rounded-full ${i === 0 ? "bg-glow/70" : "bg-white/20"}`} />
                  </div>
                ))}
              </div>
              <ParityChart className="flex-1" />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Phone */}
      <div
        style={layer(18, 14)}
        className="absolute bottom-0 right-[4%] w-[34%]"
        aria-hidden="true"
      >
        <div className="motion-safe:animate-float [animation-delay:-3s]">
        <div className="rounded-[2rem] border border-white/15 bg-[linear-gradient(160deg,#1e293b,#0b1222)] p-[6px] shadow-[0_40px_70px_-25px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="relative flex aspect-[9/19] flex-col gap-2.5 overflow-hidden rounded-[1.6rem] bg-ink-950 p-3 pt-6">
            <span className="absolute left-1/2 top-2 h-3 w-12 -translate-x-1/2 rounded-full bg-black" />
            <div className="h-2 w-2/3 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2))]" />
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2">
              <div className="h-1.5 w-1/3 rounded-full bg-white/15" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-glow/70" />
            </div>
            <ParityChart className="h-[28%]" compact />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-1.5">
                <span className="size-4 shrink-0 rounded-md bg-white/10" />
                <span className="h-1.5 flex-1 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Floating sync chip */}
      <div className="absolute left-[4%] top-[12%] rounded-xl border border-white/10 bg-ink-800/80 px-3 py-2 shadow-xl backdrop-blur-md motion-safe:animate-float" aria-hidden="true">
        <div className="flex items-center gap-2 text-xs text-fg-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-glow opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-glow" />
          </span>
          One product, every platform
        </div>
      </div>
    </div>
  );
}

/** The shared chart — identical on both devices to express "parity". */
function ParityChart({ className, compact }: { className?: string; compact?: boolean }) {
  const bars = compact ? [40, 65, 50, 85, 70, 95] : [35, 60, 45, 80, 62, 90, 74, 98];
  return (
    <div className={`flex items-end gap-[6%] rounded-lg border border-white/5 bg-white/[0.02] px-[5%] pb-[4%] pt-[6%] ${className ?? ""}`}>
      {bars.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[3px]"
          style={{
            height: `${h}%`,
            background:
              i === bars.length - 1
                ? "linear-gradient(180deg, var(--color-glow), color-mix(in oklab, var(--color-glow) 30%, transparent))"
                : "linear-gradient(180deg, color-mix(in oklab, var(--color-accent-2) 85%, white 0%), color-mix(in oklab, var(--color-accent) 25%, transparent))",
          }}
        />
      ))}
    </div>
  );
}
