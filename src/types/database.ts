// Hand-authored to match supabase/schema.sql. If you regenerate this from a
// live project (`supabase gen types typescript`), keep the Functions section
// merged back in — the RPCs return jsonb shapes described in src/types/domain.ts.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ConfigTable {
  Row: { id: number; label: string; sort_order: number; is_active: boolean; created_at: string };
  Insert: { id?: number; label: string; sort_order?: number; is_active?: boolean; created_at?: string };
  Update: { id?: number; label?: string; sort_order?: number; is_active?: boolean; created_at?: string };
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: { id: string; name: string; type: "hospital" | "ssnit" | "system"; created_at: string };
        Insert: { id?: string; name: string; type: "hospital" | "ssnit" | "system"; created_at?: string };
        Update: { id?: string; name?: string; type?: "hospital" | "ssnit" | "system"; created_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          institution_id: string | null;
          full_name: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          institution_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          institution_id?: string | null;
          full_name?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: { id: number; name: string };
        Insert: { id?: number; name: string };
        Update: { id?: number; name?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { id: number; user_id: string; role_id: number; institution_id: string | null; created_at: string };
        Insert: { id?: number; user_id: string; role_id: number; institution_id?: string | null; created_at?: string };
        Update: { id?: number; user_id?: string; role_id?: number; institution_id?: string | null; created_at?: string };
        Relationships: [];
      };
      reporting_periods: ConfigTable;
      weekly_cycles: ConfigTable;
      engagement_types: ConfigTable;
      digital_channels: ConfigTable;
      feedback_categories: ConfigTable;
      priority_levels: ConfigTable;
      statuses: ConfigTable;
      regions: ConfigTable;
      responsible_units: ConfigTable;
      platforms: ConfigTable;
      telemedicine_entries: {
        Row: {
          id: string;
          entry_id: string;
          institution_id: string;
          reporting_period_id: number | null;
          weekly_cycle_id: number | null;
          date_of_interaction: string;
          cro_name: string | null;
          ssnit_number: string;
          telephone_number: string | null;
          alternative_contact_number: string | null;
          email_address: string | null;
          physical_location: string | null;
          region_id: number | null;
          engagement_type_id: number | null;
          digital_channel_id: number | null;
          feedback_category_id: number | null;
          detailed_feedback_narrative: string | null;
          successful_contact: boolean | null;
          issue_resolved: boolean | null;
          escalation_required: boolean | null;
          key_observation: string | null;
          root_cause: string | null;
          emerging_trend: string | null;
          recommendation: string | null;
          priority_level_id: number | null;
          responsible_unit_id: number | null;
          status_id: number | null;
          is_deleted: boolean;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entry_id?: string;
          institution_id: string;
          reporting_period_id?: number | null;
          weekly_cycle_id?: number | null;
          date_of_interaction: string;
          cro_name?: string | null;
          ssnit_number: string;
          telephone_number?: string | null;
          alternative_contact_number?: string | null;
          email_address?: string | null;
          physical_location?: string | null;
          region_id?: number | null;
          engagement_type_id?: number | null;
          digital_channel_id?: number | null;
          feedback_category_id?: number | null;
          detailed_feedback_narrative?: string | null;
          successful_contact?: boolean | null;
          issue_resolved?: boolean | null;
          escalation_required?: boolean | null;
          key_observation?: string | null;
          root_cause?: string | null;
          emerging_trend?: string | null;
          recommendation?: string | null;
          priority_level_id?: number | null;
          responsible_unit_id?: number | null;
          status_id?: number | null;
          is_deleted?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["telemedicine_entries"]["Insert"]>;
        Relationships: [];
      };
      report_snapshots: {
        Row: {
          id: string;
          report_type: "weekly" | "monthly" | "quarterly" | "executive";
          period_label: string | null;
          generated_by: string | null;
          generated_at: string;
          export_format: "pdf" | "excel" | "csv" | null;
          params: Json | null;
        };
        Insert: {
          id?: string;
          report_type: "weekly" | "monthly" | "quarterly" | "executive";
          period_label?: string | null;
          generated_by?: string | null;
          generated_at?: string;
          export_format?: "pdf" | "excel" | "csv" | null;
          params?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["report_snapshots"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          table_name: string | null;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          event_type: "crud" | "login" | "logout" | "export" | "view";
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      v_entries_computed: {
        Row: Database["public"]["Tables"]["telemedicine_entries"]["Row"] & {
          reporting_period: string | null;
          weekly_cycle: string | null;
          region: string | null;
          engagement_type: string | null;
          digital_channel_used: string | null;
          feedback_category: string | null;
          priority_level: string | null;
          responsible_unit: string | null;
          status: string | null;
          recency_rank: number;
          positive_feedback: "Yes" | "No";
          complaint: "Yes" | "No";
          suggestion: "Yes" | "No";
          quarter: string;
          duplicate_flag: "DUPLICATE" | null;
          contact_missing: "MISSING CONTACT" | null;
          phone_check: "CHECK NUMBER" | null;
          recommendation_sort_key: number | null;
          observation_sort_key: number | null;
          risk_sort_key: number | null;
          opportunity_sort_key: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_weekly_summary: { Args: { p_period_id: number; p_cycle_id: number }; Returns: Json };
      get_monthly_consolidation: { Args: { p_year: number }; Returns: Json };
      get_quarterly_consolidation: { Args: { p_year: number }; Returns: Json };
      get_executive_dashboard: { Args: { p_year?: number }; Returns: Json };
      review_entry: {
        Args: {
          p_entry_id: string;
          p_status_id: number;
          p_recommendation?: string | null;
          p_priority_level_id?: number | null;
        };
        Returns: void;
      };
      log_client_event: {
        Args: {
          p_action: string;
          p_event_type: "login" | "logout" | "export" | "view";
          p_table_name?: string | null;
          p_record_id?: string | null;
          p_details?: Json | null;
        };
        Returns: void;
      };
    };
  };
}
