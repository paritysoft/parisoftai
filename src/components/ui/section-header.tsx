import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  heading: string;
  description?: string;
  as?: "h1" | "h2";
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeader({ heading, description, as: Tag = "h2", align = "left", action, className, id }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        <Tag id={id} className="text-section text-fg">
          {heading}
        </Tag>
        {description ? <p className="mt-4 text-lead text-fg-2">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
