import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { RoleName } from "@/types/domain";

export function RequireRole({ allow }: { allow: RoleName[] }) {
  const { roles, loading } = useAuth();

  if (loading) return null;

  const allowed = roles.some((r) => allow.includes(r));
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
