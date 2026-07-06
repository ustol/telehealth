import { NavLink } from "react-router-dom";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { canEditEntries, canManageConfig, canManageUsers, canViewAuditLogs, isTrustHospitalRole } from "@/lib/roles";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

export function Sidebar() {
  const { roles } = useAuth();

  const items: NavItem[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/entries", label: "Weekly Data Entry", icon: ClipboardList, show: isTrustHospitalRole(roles) || canEditEntries(roles) },
    { to: "/reports/weekly-summary", label: "Weekly Summary", icon: CalendarRange, show: true },
    { to: "/reports/monthly-consolidation", label: "Monthly Consolidation", icon: CalendarClock, show: true },
    { to: "/reports/quarterly-consolidation", label: "Quarterly Consolidation", icon: CalendarDays, show: true },
    { to: "/reports/executive-dashboard", label: "Executive Dashboard", icon: BarChart3, show: true },
    { to: "/reports/export", label: "Reports Export", icon: FileDown, show: true },
    { to: "/admin/configuration", label: "Lists / Configuration", icon: ListChecks, show: canManageConfig(roles) },
    { to: "/admin/users", label: "User Management", icon: Users, show: canManageUsers(roles) },
    { to: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck, show: canViewAuditLogs(roles) },
  ];

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          TH
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Telehealth Reporting</p>
          <p className="text-xs text-muted-foreground">Trust Hospital &middot; SSNIT</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items
          .filter((i) => i.show)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
}
