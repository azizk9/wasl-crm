import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { errorMessage, readRows, removeRow, saveRow } from './data';
import type { BaseModel, DataTable } from '../types/models';

export function useRows<T extends BaseModel>(table: DataTable) {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    if (!user) return;
    try { setLoading(true); setError(''); setRows(await readRows<T>(table, user.id, role === 'admin')); }
    catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }, [table, user, role]);
  useEffect(() => { void reload(); }, [reload]);
  const save = async (payload: Record<string, unknown>, id?: string) => {
    if (!user) throw new Error('Authentication required');
    const result = await saveRow<T>(table, user.id, payload, id);
    await reload();
    return result;
  };
  const remove = async (id: string) => {
    if (!user) throw new Error('Authentication required');
    await removeRow(table, user.id, id);
    await reload();
  };
  return { rows, loading, error, reload, save, remove };
}
