import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CashReceived, IncomeRecord, PlannedTransaction, Transaction, Trip } from '../lib/types';

export interface FinanceData {
  trips: Trip[];
  transactions: Transaction[];
  cashReceived: CashReceived[];
  incomeRecords: IncomeRecord[];
  planned: PlannedTransaction[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Shared loader for the core tables. Components that need totals, filtered
 * views, trip balances, or cash-flow projection all pull from here so
 * everyone sees a consistent snapshot.
 */
export function useFinanceData(): FinanceData {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashReceived, setCashReceived] = useState<CashReceived[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [planned, setPlanned] = useState<PlannedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const [t, tx, cr, ir, pl] = await Promise.all([
      supabase.from('trips').select('*').order('end_date', { ascending: true }),
      supabase.from('transactions').select('*').order('date', { ascending: false, nullsFirst: false }),
      supabase.from('cash_received').select('*').order('date', { ascending: true }),
      supabase.from('income_records').select('*').order('date', { ascending: false }),
      supabase.from('planned_transactions').select('*').order('start_date', { ascending: true }),
    ]);
    const firstError = t.error ?? tx.error ?? cr.error ?? pl.error;
    if (firstError) {
      const isMissingPlanned = pl.error && /planned_transactions/.test(pl.error.message);
      if (!isMissingPlanned) {
        setError(firstError.message);
      }
    }
    // income_records missing means migration 0004 not yet applied — non-fatal.
    setTrips((t.data as Trip[]) ?? []);
    setTransactions((tx.data as Transaction[]) ?? []);
    setCashReceived((cr.data as CashReceived[]) ?? []);
    setIncomeRecords((ir.data as IncomeRecord[]) ?? []);
    setPlanned((pl.data as PlannedTransaction[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener('pmf:transactions-changed', onChange);
    window.addEventListener('pmf:planned-changed', onChange);
    return () => {
      window.removeEventListener('pmf:transactions-changed', onChange);
      window.removeEventListener('pmf:planned-changed', onChange);
    };
  }, [reload]);

  return { trips, transactions, cashReceived, incomeRecords, planned, loading, error, reload };
}
