import { Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { writeAudit } from "@/lib/audit";
import { Toaster } from "@/components/ui/toaster";

export function AppShell() {
  const { profile, roles, signOut } = useAuth();

  async function handleSignOut() {
    await writeAudit("User logged out", "logout");
    await signOut();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-2 border-b bg-card px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <MobileNav />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.full_name || profile?.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {roles.join(", ") || "No role assigned"}
                {profile?.institution_name ? ` · ${profile.institution_name}` : ""}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
