import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
export const isConfigured = /^https:\/\/.+\.supabase\.co\/?$/.test(url) && key.length > 15 && !key.includes('YOUR_');
let instance: SupabaseClient | null = null;
export function getClient(): SupabaseClient {
  if (!isConfigured) throw new Error('أضف إعدادات Supabase أولاً في Secrets أو .env.local.');
  if (!instance) instance = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return instance;
}
