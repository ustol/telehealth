import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORICAL, CHART_INK } from "@/components/charts/palette";

interface Props {
  data: { month: string; patients_contacted: number }[];
}

export function MonthlyTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.gridline} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: CHART_INK.axis }} tickLine={false} axisLine={{ stroke: CHART_INK.gridline }} />
        <YAxis tick={{ fontSize: 12, fill: CHART_INK.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
        <Line
          type="monotone"
          dataKey="patients_contacted"
          name="Patients Contacted"
          stroke={CATEGORICAL[0]}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
