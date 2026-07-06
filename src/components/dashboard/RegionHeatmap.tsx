import { cn } from "@/lib/utils";
import type { RegionHeatmapRow } from "@/types/domain";

function intensityClass(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted text-muted-foreground";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-primary text-primary-foreground";
  if (ratio > 0.5) return "bg-primary/70 text-primary-foreground";
  if (ratio > 0.25) return "bg-primary/40 text-foreground";
  return "bg-primary/15 text-foreground";
}

export function RegionHeatmap({ data }: { data: RegionHeatmapRow[] }) {
  const max = Math.max(1, ...data.flatMap((r) => [r.q1, r.q2, r.q3, r.q4]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left font-medium text-muted-foreground px-2 py-1">Region</th>
            <th className="font-medium text-muted-foreground px-2 py-1">Q1</th>
            <th className="font-medium text-muted-foreground px-2 py-1">Q2</th>
            <th className="font-medium text-muted-foreground px-2 py-1">Q3</th>
            <th className="font-medium text-muted-foreground px-2 py-1">Q4</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.region}>
              <td className="px-2 py-1 whitespace-nowrap">{row.region}</td>
              {[row.q1, row.q2, row.q3, row.q4].map((v, i) => (
                <td key={i} className={cn("text-center rounded-md w-14 py-1.5 font-medium", intensityClass(v, max))}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
