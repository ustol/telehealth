import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL } from "@/components/charts/palette";
import type { FeedbackBreakdownRow } from "@/types/domain";

export function FeedbackDonutChart({ data }: { data: FeedbackBreakdownRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="category"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
