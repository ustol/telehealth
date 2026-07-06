import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNPanel } from "@/components/dashboard/TopNPanel";
import { useMonthlyConsolidation } from "@/hooks/useMonthlyConsolidation";
import { writeAudit } from "@/lib/audit";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const METRICS: { key: keyof import("@/types/domain").YearTotal; label: string }[] = [
  { key: "patients_contacted", label: "Total Patients Contacted" },
  { key: "followup_activities", label: "Total Follow-Up Activities" },
  { key: "feedback_records", label: "Total Feedback Records" },
  { key: "complaints", label: "Total Complaints" },
  { key: "issues_resolved", label: "Total Issues Resolved" },
  { key: "escalations", label: "Total Escalations" },
];

export default function MonthlyConsolidation() {
  const [year, setYear] = React.useState(CURRENT_YEAR);
  const { data, isLoading } = useMonthlyConsolidation(year);

  React.useEffect(() => {
    writeAudit("Viewed Monthly Consolidation", "view");
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Consolidation</h1>
          <p className="text-muted-foreground">Weekly cycles automatically aggregated to month.</p>
        </div>
        <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {data.months.map((m) => <TableHead key={m.month} className="text-right">{m.month}</TableHead>)}
                    <TableHead className="text-right font-semibold">Year Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {METRICS.map((metric) => (
                    <TableRow key={metric.key}>
                      <TableCell className="font-medium">{metric.label}</TableCell>
                      {data.months.map((m) => (
                        <TableCell key={m.month} className="text-right">{m[metric.key]}</TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">{data.year_total[metric.key]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <TopNPanel title="Key Observations (Top 5)" items={data.top_observations} />
            <TopNPanel title="Key Recommendations (Top 5)" items={data.top_recommendations} />
            <TopNPanel title="Risk Areas (Top 5)" items={data.top_risks} />
            <TopNPanel title="Opportunities (Top 5)" items={data.top_opportunities} />
          </div>
        </>
      )}
    </div>
  );
}
