import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WeeklySummary } from "@/types/domain";

export function useWeeklySummary(periodId: number | undefined, cycleId: number | undefined) {
  return useQuery({
    queryKey: ["weekly-summary", periodId, cycleId],
    queryFn: async (): Promise<WeeklySummary> => {
      const { data, error } = await supabase.rpc("get_weekly_summary", {
        p_period_id: periodId!,
        p_cycle_id: cycleId!,
      });
      if (error) throw error;
      return data as unknown as WeeklySummary;
    },
    enabled: Boolean(periodId && cycleId),
  });
}
