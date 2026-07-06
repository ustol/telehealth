import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORICAL, CHART_INK } from "@/components/charts/palette";
import type { EngagementBreakdownRow } from "@/types/domain";

export function EngagementBreakdownChart({ data }: { data: EngagementBreakdownRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.gridline} vertical={false} />
        <XAxis
          dataKey="engagement_type"
          tick={{ fontSize: 11, fill: CHART_INK.axis }}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.gridline }}
          angle={-30}
          textAnchor="end"
          interval={0}
          height={70}
        />
        <YAxis tick={{ fontSize: 12, fill: CHART_INK.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="activities" name="Activities" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="complaints" name="Complaints" fill={CATEGORICAL[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
