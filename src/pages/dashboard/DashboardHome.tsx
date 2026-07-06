import { Link } from "react-router-dom";
import { ClipboardList, BarChart3, CalendarRange, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { canEditEntries, isTrustHospitalRole } from "@/lib/roles";

export default function DashboardHome() {
  const { profile, roles } = useAuth();

  const cards = [
    {
      to: "/entries",
      title: "Weekly Data Entry",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Joint telemedicine reporting system for The Trust Hospital and SSNIT.
        </p>
      </div>
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
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm">
            Your role{roles.length > 1 ? "s" : ""}:{" "}
            <span className="font-medium">{roles.join(", ") || "No role assigned yet — contact your System Admin"}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
