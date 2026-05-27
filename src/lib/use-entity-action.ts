'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';

export function useDelete(table: string) {
  const { refresh } = useData();
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const deleteItem = async (id: string, onSuccess?: () => void) => {
    setDeleting(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error: sbErr } = await createClient().from(table).delete().eq('id', id);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return { deleteItem, deleting, error, clearError: () => setError(null) };
}

export function useUpdate(table: string) {
  const { refresh } = useData();
  const [updating, setUpdating]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const updateItem = async (
    id: string,
    data: Record<string, unknown>,
    onSuccess?: () => void,
  ) => {
    setUpdating(true); setError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { error: sbErr } = await createClient().from(table).update(data).eq('id', id);
      if (sbErr) throw new Error(sbErr.message);
      refresh();
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  return { updateItem, updating, error, clearError: () => setError(null) };
}
