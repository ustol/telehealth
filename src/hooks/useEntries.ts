import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type EntryComputedRow = Database["public"]["Views"]["v_entries_computed"]["Row"];
export type EntryInsert = Database["public"]["Tables"]["telemedicine_entries"]["Insert"];
export type EntryUpdate = Database["public"]["Tables"]["telemedicine_entries"]["Update"];

export function useEntries() {
  return useQuery({
    queryKey: ["entries"],
    queryFn: async (): Promise<EntryComputedRow[]> => {
      const { data, error } = await supabase
        .from("v_entries_computed")
        .select("*")
        .order("date_of_interaction", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EntryInsert) => {
      const { data, error } = await supabase.from("telemedicine_entries").insert(input).select("id, entry_id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: EntryUpdate & { id: string }) => {
      const { error } = await supabase.from("telemedicine_entries").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entries"] }),
  });
}

export function useSoftDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("telemedicine_entries").update({ is_deleted: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entries"] }),
  });
}
