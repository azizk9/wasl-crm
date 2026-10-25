import { getClient } from './supabase';
import type { DataTable } from '../types/models';

export async function readRows<T>(table: DataTable, owner: string, includeAll = false): Promise<T[]> {
  let query = getClient().from(table).select('*').order('created_at', { ascending: false }).limit(1000);
  if (!includeAll) query = query.eq('owner_id', owner);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}
export async function saveRow<T>(table: DataTable, owner: string, payload: Record<string, unknown>, id?: string): Promise<T> {
  // Explicitly overwrite any passed owner_id instead of trusting form input.
  const safe = id ? payload : table === 'customers' ? payload : { ...payload, owner_id: owner };
  const query = id
    ? getClient().from(table).update(safe).eq('id', id).eq('owner_id', owner)
    : getClient().from(table).insert(safe);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as T;
}
export async function removeRow(table: DataTable, owner: string, id: string): Promise<void> {
  const { error } = await getClient().from(table).delete().eq('id', id).eq('owner_id', owner);
  if (error) throw error;
}
export async function batchInsertRows(table: DataTable, owner: string, rows: Record<string, unknown>[]): Promise<{ inserted: number; skipped: number }> {
  if (!rows.length) return { inserted: 0, skipped: 0 };
  const payload = table === 'customers' ? rows : rows.map(r => ({ ...r, owner_id: owner }));
  const { data, error } = await getClient().from(table).insert(payload).select('id');
  if (error) {
    if (error.code === '23505') throw new Error('بعض السجلات مكررة في قاعدة البيانات.');
    throw error;
  }
  const inserted = data?.length ?? 0;
  return { inserted, skipped: rows.length - inserted };
}
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('duplicate key')) return 'هذه البيانات موجودة بالفعل.';
    if (error.message.includes('foreign key')) return 'العنصر مرتبط بسجل آخر أو غير مسموح بالوصول إليه.';
    if (error.message.includes('row-level security')) return 'ليست لديك صلاحية تنفيذ هذه العملية.';
    return error.message;
  }
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
