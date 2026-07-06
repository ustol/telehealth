import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopNPanel } from "@/components/dashboard/TopNPanel";
import { RegionHeatmap } from "@/components/dashboard/RegionHeatmap";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { SingleSeriesBarChart } from "@/components/charts/SingleSeriesBarChart";
import { EngagementBreakdownChart } from "@/components/charts/EngagementBreakdownChart";
import { FeedbackDonutChart } from "@/components/charts/FeedbackDonutChart";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import { writeAudit } from "@/lib/audit";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function ExecutiveDashboard() {
  const [year, setYear] = React.useState(CURRENT_YEAR);
  const { data, isLoading } = useExecutiveDashboard(year);

  React.useEffect(() => {
    writeAudit("Viewed Executive Dashboard", "view");
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">The Trust Hospital &middot; SSNIT joint telemedicine reporting — FY {year}</p>
        </div>
        <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total Patients Contacted" value={data.kpis.total_patients_contacted} />
            <KpiCard label="Total Follow-Up Activities" value={data.kpis.total_followup_activities} />
            <KpiCard label="Total Complaints" value={data.kpis.total_complaints} />
            <KpiCard label="Issues Resolved" value={data.kpis.issues_resolved} />
            <KpiCard label="Open Issues" value={data.kpis.open_issues} />
            <KpiCard label="Closed Issues" value={data.kpis.closed_issues} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Patients Contacted — Monthly Trend</CardTitle></CardHeader>
              <CardContent><MonthlyTrendChart data={data.monthly_trend} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Follow-Up Activities by Month</CardTitle></CardHeader>
              <CardContent>
                <SingleSeriesBarChart data={data.monthly_trend} xKey="month" yKey="followup_activities" yLabel="Activities" colorIndex={0} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Complaints by Month</CardTitle></CardHeader>
              <CardContent>
                <SingleSeriesBarChart data={data.monthly_trend} xKey="month" yKey="complaints" yLabel="Complaints" colorIndex={1} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Client Feedback Breakdown</CardTitle></CardHeader>
              <CardContent><FeedbackDonutChart data={data.feedback_breakdown} /></CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Follow-Up Activities & Complaints by Engagement Type</CardTitle></CardHeader>
              <CardContent><EngagementBreakdownChart data={data.engagement_breakdown} /></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Engagement by Region (heatmap — Q1 / Q2 / Q3 / Q4 {year})</CardTitle>
            </CardHeader>
            <CardContent><RegionHeatmap data={data.region_heatmap} /></CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-3">Executive Insights</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TopNPanel title="Top 5 Observations" items={data.top_observations} />
              <TopNPanel title="Top 5 Risks" items={data.top_risks} />
              <TopNPanel title="Top 5 Recommendations" items={data.top_recommendations} />
              <TopNPanel title="Top 5 Opportunities" items={data.top_opportunities} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
