import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CashReceived, Transaction, Trip } from '../lib/types';

export interface FinanceData {
  trips: Trip[];
  transactions: Transaction[];
  cashReceived: CashReceived[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Shared loader for the three core tables. Components that need totals,
 * filtered views, or the trip-balance calculation all pull from here so
 * everyone sees a consistent snapshot.
 */
export function useFinanceData(): FinanceData {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashReceived, setCashReceived] = useState<CashReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const [t, tx, cr] = await Promise.all([
      supabase.from('trips').select('*').order('end_date', { ascending: true }),
      supabase.from('transactions').select('*').order('date', { ascending: false, nullsFirst: false }),
      supabase.from('cash_received').select('*').order('date', { ascending: true }),
    ]);
    if (t.error || tx.error || cr.error) {
      setError(t.error?.message ?? tx.error?.message ?? cr.error?.message ?? 'Load failed');
    } else {
      setTrips((t.data as Trip[]) ?? []);
      setTransactions((tx.data as Transaction[]) ?? []);
      setCashReceived((cr.data as CashReceived[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener('pmf:transactions-changed', onChange);
    return () => window.removeEventListener('pmf:transactions-changed', onChange);
  }, [reload]);

  return { trips, transactions, cashReceived, loading, error, reload };
}
