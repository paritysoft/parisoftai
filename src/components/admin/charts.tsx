import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free charts rendered on the server.
 * Single series => no legend; every bar has a hover tooltip and the data is also in a
 * screen-reader table, so nothing relies on color or hover alone.
 */
export function BarChart({ data, label, valueLabel = "inquiries" }: { data: { label: string; value: number }[]; label: string; valueLabel?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="py-10 text-center text-sm text-fg-3">No data for this period yet.</p>;
  return (
    <figure>
      <div className="flex h-44 items-end gap-[2px] border-b border-line" aria-hidden="true">
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-accent/80 transition-colors group-hover:bg-accent"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 3 : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-ink-950 px-2 py-1 text-xs text-fg group-hover:block">
              {d.label}: <strong>{d.value}</strong> {valueLabel}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.7rem] text-fg-3" aria-hidden="true">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function HBarList({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.every((d) => d.value === 0)) return <p className="py-10 text-center text-sm text-fg-3">No data yet.</p>;
  return (
    <ul className="space-y-3" aria-label={label}>
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-sm">
          <span className="truncate text-fg-2">{d.label}</span>
          <span className="h-2 rounded-full bg-ink-700" aria-hidden="true">
            <span className={cn("block h-full rounded-full bg-accent/80")} style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-fg">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}
