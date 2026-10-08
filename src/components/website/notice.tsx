import { Info } from "lucide-react";

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4 text-sm text-amber-100">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
