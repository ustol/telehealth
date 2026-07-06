import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopNPanel } from "@/components/dashboard/TopNPanel";
import { useConfigList } from "@/hooks/useConfigLists";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { writeAudit } from "@/lib/audit";

export default function WeeklySummary() {
  const { data: periods } = useConfigList("reporting_periods");
  const { data: cycles } = useConfigList("weekly_cycles");
  const [periodId, setPeriodId] = React.useState<number>();
  const [cycleId, setCycleId] = React.useState<number>();

  React.useEffect(() => {
    if (!periodId && periods?.length) setPeriodId(periods[periods.length - 1].id);
  }, [periods, periodId]);
  React.useEffect(() => {
    if (!cycleId && cycles?.length) setCycleId(cycles[0].id);
  }, [cycles, cycleId]);

  const { data: summary, isLoading } = useWeeklySummary(periodId, cycleId);

  React.useEffect(() => {
    writeAudit("Viewed Weekly Summary", "view", { tableName: "reporting_periods" });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Summary</h1>
        <p className="text-muted-foreground">Bi-weekly operational summary for a selected reporting period and cycle.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reporting Period</label>
            <Select value={periodId?.toString()} onValueChange={(v) => setPeriodId(Number(v))}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select period" /></SelectTrigger>
              <SelectContent>
                {periods?.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Weekly Cycle</label>
            <Select value={cycleId?.toString()} onValueChange={(v) => setCycleId(Number(v))}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select cycle" /></SelectTrigger>
              <SelectContent>
                {cycles?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading || !summary ? (
        <p className="text-sm text-muted-foreground">Loading summary…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Total Patients Contacted" value={summary.total_patients_contacted} />
            <KpiCard label="Total Follow-Up Activities" value={summary.total_followup_activities} />
            <KpiCard label="Total Feedback Collected" value={summary.total_feedback_collected} />
            <KpiCard label="Total Complaints" value={summary.total_complaints} />
            <KpiCard label="Total Issues Resolved" value={summary.total_issues_resolved} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Feedback Themes (selected cycle)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Positive</p>
                <p className="text-xl font-semibold">{summary.positive_feedback}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Complaints</p>
                <p className="text-xl font-semibold">{summary.complaints}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suggestions</p>
                <p className="text-xl font-semibold">{summary.suggestions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neutral / Other</p>
                <p className="text-xl font-semibold">{summary.neutral_other}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <TopNPanel title="Top 3 Observations (selected cycle)" items={summary.top_observations} />
            <TopNPanel title="Top 3 Recommendations (selected cycle)" items={summary.top_recommendations} />
          </div>
        </>
      )}
    </div>
  );
}
