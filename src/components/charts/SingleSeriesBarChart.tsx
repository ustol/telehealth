import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORICAL, CHART_INK } from "@/components/charts/palette";

interface Props {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  yLabel: string;
  colorIndex?: number;
}

export function SingleSeriesBarChart({ data, xKey, yKey, yLabel, colorIndex = 0 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.gridline} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: CHART_INK.axis }} tickLine={false} axisLine={{ stroke: CHART_INK.gridline }} />
        <YAxis tick={{ fontSize: 12, fill: CHART_INK.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
        <Bar dataKey={yKey} name={yLabel} fill={CATEGORICAL[colorIndex]} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
