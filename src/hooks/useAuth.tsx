import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { RoleName } from "@/types/domain";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  institution_id: string | null;
  institution_name: string | null;
  is_active: boolean;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  roles: RoleName[];
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

async function loadProfileAndRoles(userId: string): Promise<{ profile: Profile | null; roles: RoleName[] }> {
  const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, institution_id, is_active, institutions ( name )")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("roles ( name )").eq("user_id", userId),
  ]);

  const profile: Profile | null = profileRow
    ? {
        id: profileRow.id,
        full_name: profileRow.full_name,
        email: profileRow.email,
        institution_id: profileRow.institution_id,
        institution_name: (profileRow as unknown as { institutions: { name: string } | null }).institutions?.name ?? null,
        is_active: profileRow.is_active,
      }
    : null;

  const roles: RoleName[] =
    (roleRows ?? [])
      .map((r) => (r as unknown as { roles: { name: RoleName } | null }).roles?.name)
      .filter((r): r is RoleName => Boolean(r)) ?? [];

  return { profile, roles };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [roles, setRoles] = React.useState<RoleName[]>([]);
  const [loading, setLoading] = React.useState(true);

  const hydrate = React.useCallback(async (sess: Session | null) => {
    setSession(sess);
    if (sess?.user) {
      const { profile: p, roles: r } = await loadProfileAndRoles(sess.user.id);
      setProfile(p);
      setRoles(r);
    } else {
      setProfile(null);
      setRoles([]);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await hydrate(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      hydrate(sess);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refresh = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }, [hydrate]);

  return (
    <AuthContext.Provider value={{ session, profile, roles, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
