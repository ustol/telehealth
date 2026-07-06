import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  event_type: "crud" | "login" | "logout" | "export" | "view";
  created_at: string;
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, actor_id, action, table_name, record_id, event_type, created_at, profiles ( full_name, email )")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as unknown as {
          id: string;
          actor_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          event_type: AuditLogRow["event_type"];
          created_at: string;
          profiles: { full_name: string | null; email: string | null } | null;
        };
        return {
          id: r.id,
          actor_id: r.actor_id,
          actor_name: r.profiles?.full_name || r.profiles?.email || "Unknown",
          action: r.action,
          table_name: r.table_name,
          record_id: r.record_id,
          event_type: r.event_type,
          created_at: r.created_at,
        };
      });
    },
  });
}
