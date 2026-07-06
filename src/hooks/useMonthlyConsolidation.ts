import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MonthlyConsolidation } from "@/types/domain";

export function useMonthlyConsolidation(year: number) {
  return useQuery({
    queryKey: ["monthly-consolidation", year],
    queryFn: async (): Promise<MonthlyConsolidation> => {
      const { data, error } = await supabase.rpc("get_monthly_consolidation", { p_year: year });
      if (error) throw error;
      return data as unknown as MonthlyConsolidation;
    },
  });
}
