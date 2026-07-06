import {
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  CalendarClock,
  CalendarDays,
  BarChart3,
  FileDown,
  ListChecks,
  Users,
  ShieldCheck,
} from "lucide-react";
import { canEditEntries, canManageConfig, canManageUsers, canViewAuditLogs, isTrustHospitalRole } from "@/lib/roles";
import type { RoleName } from "@/types/domain";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

export function getNavItems(roles: RoleName[]): NavItem[] {
  return [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
    {
      to: "/entries",
      label: "Weekly Data Entry",
      icon: ClipboardList,
      show: isTrustHospitalRole(roles) || canEditEntries(roles),
    },
    { to: "/reports/weekly-summary", label: "Weekly Summary", icon: CalendarRange, show: true },
    { to: "/reports/monthly-consolidation", label: "Monthly Consolidation", icon: CalendarClock, show: true },
    { to: "/reports/quarterly-consolidation", label: "Quarterly Consolidation", icon: CalendarDays, show: true },
    { to: "/reports/executive-dashboard", label: "Executive Dashboard", icon: BarChart3, show: true },
    { to: "/reports/export", label: "Reports Export", icon: FileDown, show: true },
    { to: "/admin/configuration", label: "Lists / Configuration", icon: ListChecks, show: canManageConfig(roles) },
    { to: "/admin/users", label: "User Management", icon: Users, show: canManageUsers(roles) },
    { to: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck, show: canViewAuditLogs(roles) },
  ];
}
