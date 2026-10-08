"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TitledItem } from "@/types/content";

/** Horizontal timeline on desktop, vertical stepper on mobile. Progress draws once when in view. */
export function ProcessTimeline({ steps }: { steps: TitledItem[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.8) return;
     
    setActive(false);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={ref} className="relative grid gap-0 lg:grid-cols-5 lg:gap-6">
      {/* desktop rail */}
      <span aria-hidden="true" className="absolute left-0 right-0 top-[1.375rem] hidden h-px bg-line lg:block" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 right-0 top-[1.375rem] hidden h-px origin-left bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-2),var(--color-glow))] transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] lg:block",
          active ? "scale-x-100" : "scale-x-0",
        )}
      />
      {/* mobile rail */}
      <span aria-hidden="true" className="absolute bottom-6 left-[1.375rem] top-6 w-px bg-line lg:hidden" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-6 left-[1.375rem] top-6 w-px origin-top bg-[linear-gradient(180deg,var(--color-accent),var(--color-glow))] transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] lg:hidden",
          active ? "scale-y-100" : "scale-y-0",
        )}
      />
      {steps.map((step, i) => (
        <li key={`${step.title}-${i}`} className="relative flex gap-5 pb-10 last:pb-0 lg:flex-col lg:gap-6 lg:pb-0">
          <span
            className={cn(
              "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-medium transition-[background,border-color,color,box-shadow] duration-500",
              active
                ? "border-accent/70 bg-ink-800 text-fg shadow-[0_0_0_6px_var(--color-ink-950),0_0_24px_-4px_var(--color-accent)]"
                : "border-line bg-ink-900 text-fg-3 shadow-[0_0_0_6px_var(--color-ink-950)]",
            )}
            style={{ transitionDelay: active ? `${i * 220}ms` : "0ms" }}
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="pt-1.5 lg:pt-0">
            <h3 className="text-lg font-semibold text-fg">
              <span className="sr-only">Step {i + 1}: </span>
              {step.title}
            </h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-3">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
