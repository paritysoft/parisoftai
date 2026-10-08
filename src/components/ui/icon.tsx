import {
  Apple,
  Bot,
  Boxes,
  Code2,
  Cpu,
  Layers,
  Monitor,
  PenTool,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Icons selectable in the admin for services. Unknown names fall back to Code2. */
export const ICONS: Record<string, LucideIcon> = {
  apple: Apple,
  smartphone: Smartphone,
  layers: Layers,
  monitor: Monitor,
  server: Server,
  sparkles: Sparkles,
  "pen-tool": PenTool,
  wrench: Wrench,
  bot: Bot,
  cpu: Cpu,
  boxes: Boxes,
  shield: ShieldCheck,
  code: Code2,
};

export const ICON_NAMES = Object.keys(ICONS);

export function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Code2;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.6} />;
}
