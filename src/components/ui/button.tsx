import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-[var(--radius-control)] transition-[background,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)] disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-2))] shadow-[0_8px_24px_-10px_var(--color-accent)] hover:shadow-[0_14px_32px_-10px_var(--color-accent)] hover:brightness-110 active:translate-y-px",
  secondary:
    "text-fg border border-line-strong bg-white/[0.03] hover:bg-white/[0.07] hover:border-fg-3/60 active:translate-y-px",
  ghost: "text-fg-2 hover:text-fg hover:bg-white/[0.05]",
  subtle: "text-fg bg-ink-700 hover:bg-line border border-line",
  danger: "text-white bg-red-600/90 hover:bg-red-600 active:translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  external?: boolean;
  "aria-label"?: string;
  prefetch?: boolean;
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children, external, prefetch, ...rest }: ButtonLinkProps) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses(variant, size, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
