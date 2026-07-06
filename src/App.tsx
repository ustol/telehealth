import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { AppShell } from "@/components/layout/AppShell";

import Login from "@/pages/auth/Login";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import WeeklyDataEntry from "@/pages/entries/WeeklyDataEntry";
import WeeklySummary from "@/pages/reports/WeeklySummary";
import MonthlyConsolidation from "@/pages/reports/MonthlyConsolidation";
import QuarterlyConsolidation from "@/pages/reports/QuarterlyConsolidation";
import ExecutiveDashboard from "@/pages/reports/ExecutiveDashboard";
import ReportsExport from "@/pages/reports/ReportsExport";
import Configuration from "@/pages/admin/Configuration";
import UserManagement from "@/pages/admin/UserManagement";
import AuditLogs from "@/pages/admin/AuditLogs";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardHome />} />

            <Route
              element={
                <RequireRole
                  allow={["Trust Hospital Admin", "Trust Hospital Data Entry Officer", "Trust Hospital Reviewer"]}
                />
              }
            >
              <Route path="/entries" element={<WeeklyDataEntry />} />
            </Route>

            <Route path="/reports/weekly-summary" element={<WeeklySummary />} />
            <Route path="/reports/monthly-consolidation" element={<MonthlyConsolidation />} />
            <Route path="/reports/quarterly-consolidation" element={<QuarterlyConsolidation />} />
            <Route path="/reports/executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="/reports/export" element={<ReportsExport />} />

            <Route element={<RequireRole allow={["System Admin"]} />}>
              <Route path="/admin/configuration" element={<Configuration />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            <Route element={<RequireRole allow={["System Admin", "Trust Hospital Admin"]} />}>
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
