import * as React from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  BarChart3,
  CalendarRange,
  FileDown,
  Users,
  Activity,
  MessageSquareWarning,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { FeedbackDonutChart } from "@/components/charts/FeedbackDonutChart";
import { useAuth } from "@/hooks/useAuth";
import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import { canEditEntries, isTrustHospitalRole } from "@/lib/roles";
import { writeAudit } from "@/lib/audit";

const CURRENT_YEAR = new Date().getFullYear();

export default function DashboardHome() {
  const { profile, roles } = useAuth();
  const hasRole = roles.length > 0;
  const { data, isLoading } = useExecutiveDashboard(CURRENT_YEAR, { enabled: hasRole });

  React.useEffect(() => {
    if (hasRole) writeAudit("Viewed Dashboard", "view");
  }, [hasRole]);

  const cards = [
    {
      to: "/entries",
      title: "Data Entry",
      description: "Capture telemedicine interactions for SSNIT pensioners.",
      icon: ClipboardList,
      show: isTrustHospitalRole(roles) || canEditEntries(roles),
    },
    {
      to: "/reports/weekly-summary",
      title: "Weekly Summary",
      description: "Patients contacted, feedback, and top observations for a selected week.",
      icon: CalendarRange,
      show: true,
    },
    {
      to: "/reports/executive-dashboard",
      title: "Executive Dashboard",
      description: "KPIs, trends, region heatmap, and management insights.",
      icon: BarChart3,
      show: true,
    },
    {
      to: "/reports/export",
      title: "Reports Export",
      description: "Filter and export reports to PDF, Excel, or CSV.",
      icon: FileDown,
      show: true,
    },
  ];

  const hasData = Boolean(data && data.kpis.total_followup_activities > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Joint telemedicine reporting system for The Trust Hospital and SSNIT.
        </p>
      </div>

      {!hasRole ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">
              <span className="font-medium">No role assigned yet</span> — contact your System Admin to get access
              to data entry and reports.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overview — {CURRENT_YEAR}</h2>
          </div>

          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Loading overview…</p>
          ) : !hasData ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No telemedicine interactions recorded yet for {CURRENT_YEAR}.
                  {(isTrustHospitalRole(roles) || canEditEntries(roles)) && (
                    <>
                      {" "}
                      <Link to="/entries" className="font-medium text-primary hover:underline">
                        Add the first entry
                      </Link>
                      .
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Total Patients Contacted" value={data.kpis.total_patients_contacted} icon={Users} />
                <KpiCard label="Total Follow-Up Activities" value={data.kpis.total_followup_activities} icon={Activity} />
                <KpiCard label="Total Complaints" value={data.kpis.total_complaints} icon={MessageSquareWarning} tone="warning" />
                <KpiCard label="Issues Resolved" value={data.kpis.issues_resolved} icon={CheckCircle2} tone="success" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Patients Contacted — Monthly Trend</CardTitle></CardHeader>
                  <CardContent><MonthlyTrendChart data={data.monthly_trend} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Client Feedback Breakdown</CardTitle></CardHeader>
                  <CardContent><FeedbackDonutChart data={data.feedback_breakdown} /></CardContent>
                </Card>
              </div>

              <p className="text-sm text-muted-foreground">
                Full trends, region heatmap, and management insights are on the{" "}
                <Link to="/reports/executive-dashboard" className="font-medium text-primary hover:underline">
                  Executive Dashboard
                </Link>
                .
              </p>
            </>
          )}
        </div>
      )}

      {hasRole && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards
              .filter((c) => c.show)
              .map((c) => (
                <Link key={c.to} to={c.to}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <c.icon className="h-6 w-6 text-primary mb-2" />
                      <CardTitle className="text-base">{c.title}</CardTitle>
                      <CardDescription>{c.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
