import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";

export async function writeAudit(
  action: string,
  eventType: "login" | "logout" | "export" | "view",
  opts?: { tableName?: string; recordId?: string; details?: Record<string, unknown> }
) {
  const { error } = await supabase.rpc("log_client_event", {
    p_action: action,
    p_event_type: eventType,
    p_table_name: opts?.tableName ?? null,
    p_record_id: opts?.recordId ?? null,
    p_details: (opts?.details as Json) ?? null,
  });
  if (error) {
    // Audit logging must never block the user-facing action it accompanies.
    console.error("writeAudit failed:", error.message);
  }
}
