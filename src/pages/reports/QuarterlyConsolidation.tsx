import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopNPanel } from "@/components/dashboard/TopNPanel";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useQuarterlyConsolidation } from "@/hooks/useQuarterlyConsolidation";
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

export default function QuarterlyConsolidation() {
  const [year, setYear] = React.useState(CURRENT_YEAR);
  const { data, isLoading } = useQuarterlyConsolidation(year);

  React.useEffect(() => {
    writeAudit("Viewed Quarterly Consolidation", "view");
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quarterly Consolidation</h1>
          <p className="text-muted-foreground">Monthly reports automatically aggregated to quarters and the full year.</p>
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
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {data.quarters.map((q) => <TableHead key={q.quarter} className="text-right">{q.quarter}</TableHead>)}
                    <TableHead className="text-right font-semibold">Year Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {METRICS.map((metric) => (
                    <TableRow key={metric.key}>
                      <TableCell className="font-medium">{metric.label}</TableCell>
                      {data.quarters.map((q) => (
                        <TableCell key={q.quarter} className="text-right">{q[metric.key]}</TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">{data.year_total[metric.key]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-3">Annual Trends</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard label="Busiest Month (patients)" value={data.busiest_month?.month ?? "—"} />
              <KpiCard label="Busiest Quarter (patients)" value={data.busiest_quarter?.quarter ?? "—"} />
              <KpiCard label="Months With Activity" value={data.months_with_activity} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <TopNPanel title="Emerging Trends (Top 5)" items={data.emerging_trends} />
            <TopNPanel title="Major Service Concerns (Top 5)" items={data.major_service_concerns} />
            <TopNPanel title="Key Recommendations for Management (Top 5)" items={data.key_recommendations_for_management} />
          </div>
        </>
      )}
    </div>
  );
}
