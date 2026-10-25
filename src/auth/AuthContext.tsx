import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getClient } from '../lib/supabase';
import type { UserRole } from '../types/models';

type AuthState = { user: User | null; loading: boolean; role: UserRole; fullName: string; refresh: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('sales');
  const [fullName, setFullName] = useState('');
  const loadProfile = async (uid: string) => {
    const { data } = await getClient().from('profiles').select('full_name,role').eq('id', uid).maybeSingle();
    if (data) { setFullName(data.full_name ?? ''); setRole((data.role as UserRole) ?? 'sales'); }
  };
  const refresh = async () => {
    const { data } = await getClient().auth.getUser();
    setUser(data.user ?? null);
    if (data.user) await loadProfile(data.user.id);
  };
  useEffect(() => {
    let active = true;
    getClient().auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null); setLoading(false);
      if (data.user) void loadProfile(data.user.id);
    }).catch(() => { if (active) setLoading(false); });
    const { data: { subscription } } = getClient().auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null); setLoading(false);
      if (session?.user) void loadProfile(session.user.id);
      else { setRole('sales'); setFullName(''); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const value = useMemo(() => ({ user, loading, role, fullName, refresh }), [user, loading, role, fullName]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider required'); return value; }
