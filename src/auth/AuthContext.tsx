import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getClient } from '../lib/supabase';

type AuthState = { user: User | null; loading: boolean; refresh: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const { data } = await getClient().auth.getUser();
    setUser(data.user ?? null);
  };
  useEffect(() => {
    let active = true;
    getClient().auth.getUser().then(({ data }) => { if (active) { setUser(data.user ?? null); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    const { data: { subscription } } = getClient().auth.onAuthStateChange((_event, session) => {
      if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const value = useMemo(() => ({ user, loading, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider required'); return value; }
