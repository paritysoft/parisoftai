import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABELS, type Platform } from "@/types/content";

export function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  if (platforms.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Platforms">
      {platforms.map((p) => (
        <li key={p}>
          <Badge tone="accent">{PLATFORM_LABELS[p]}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function TechList({ items, limit }: { items: string[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  if (shown.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
      {shown.map((t) => (
        <li key={t}>
          <Badge mono>{t}</Badge>
        </li>
      ))}
      {limit && items.length > limit ? (
        <li>
          <Badge mono>+{items.length - limit}</Badge>
        </li>
      ) : null}
    </ul>
  );
}
