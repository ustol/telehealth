import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const CONFIG_TABLES = [
  "reporting_periods",
  "weekly_cycles",
  "engagement_types",
  "digital_channels",
  "feedback_categories",
  "priority_levels",
  "statuses",
  "regions",
  "responsible_units",
  "platforms",
] as const;

export type ConfigTableName = (typeof CONFIG_TABLES)[number];

export interface ConfigItem {
  id: number;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export function useConfigList(table: ConfigTableName) {
  return useQuery({
    queryKey: ["config", table],
    queryFn: async (): Promise<ConfigItem[]> => {
      const { data, error } = await supabase
        .from(table)
        .select("id, label, sort_order, is_active")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllConfigLists() {
  return useQuery({
    queryKey: ["config", "all"],
    queryFn: async () => {
      const results = await Promise.all(
        CONFIG_TABLES.map(async (table) => {
          const { data, error } = await supabase
            .from(table)
            .select("id, label, sort_order, is_active")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });
          if (error) throw error;
          return [table, data ?? []] as const;
        })
      );
      return Object.fromEntries(results) as Record<ConfigTableName, ConfigItem[]>;
    },
  });
}

export function useConfigMutations(table: ConfigTableName) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["config", table] });
    queryClient.invalidateQueries({ queryKey: ["config", "all"] });
  };

  const create = useMutation({
    mutationFn: async (input: { label: string; sort_order: number }) => {
      const { error } = await supabase.from(table).insert(input);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: { id: number; label?: string; sort_order?: number; is_active?: boolean }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from(table).update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
