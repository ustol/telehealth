import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { QuarterlyConsolidation } from "@/types/domain";

export function useQuarterlyConsolidation(year: number) {
  return useQuery({
    queryKey: ["quarterly-consolidation", year],
    queryFn: async (): Promise<QuarterlyConsolidation> => {
      const { data, error } = await supabase.rpc("get_quarterly_consolidation", { p_year: year });
      if (error) throw error;
      return data as unknown as QuarterlyConsolidation;
    },
  });
}
