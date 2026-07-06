import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ExecutiveDashboard } from "@/types/domain";

export function useExecutiveDashboard(year?: number) {
  return useQuery({
    queryKey: ["executive-dashboard", year],
    queryFn: async (): Promise<ExecutiveDashboard> => {
      const { data, error } = await supabase.rpc("get_executive_dashboard", year ? { p_year: year } : {});
      if (error) throw error;
      return data as unknown as ExecutiveDashboard;
    },
  });
}
