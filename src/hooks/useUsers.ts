import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RoleName } from "@/types/domain";

export interface ManagedUser {
  id: string;
  full_name: string | null;
  email: string | null;
  institution_id: string | null;
  institution_name: string | null;
  is_active: boolean;
  roles: { id: number; name: RoleName }[];
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<ManagedUser[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, institution_id, is_active, institutions ( name ), user_roles ( role_id, roles ( id, name ) )")
        .order("full_name");
      if (error) throw error;
      return (data ?? []).map((row) => {
        const r = row as unknown as {
          id: string;
          full_name: string | null;
          email: string | null;
          institution_id: string | null;
          is_active: boolean;
          institutions: { name: string } | null;
          user_roles: { roles: { id: number; name: RoleName } | null }[];
        };
        return {
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          institution_id: r.institution_id,
          institution_name: r.institutions?.name ?? null,
          is_active: r.is_active,
          roles: r.user_roles.map((ur) => ur.roles).filter((x): x is { id: number; name: RoleName } => Boolean(x)),
        };
      });
    },
  });
}

export function useInstitutions() {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("id, name, type").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("id, name").order("id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const setInstitution = useMutation({
    mutationFn: async ({ userId, institutionId }: { userId: string; institutionId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ institution_id: institutionId }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { setInstitution, setActive, addRole, removeRole };
}
