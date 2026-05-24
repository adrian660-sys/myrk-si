import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  CashReceived, PlannedTransaction, Project, ProjectReceipt, Transaction, Trip,
} from '../lib/types';

export interface FinanceData {
  trips: Trip[];
  transactions: Transaction[];
  cashReceived: CashReceived[];
  projects: Project[];
  projectReceipts: ProjectReceipt[];
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectReceipts, setProjectReceipts] = useState<ProjectReceipt[]>([]);
  const [planned, setPlanned] = useState<PlannedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const [t, tx, cr, pr, prr, pl] = await Promise.all([
      supabase.from('trips').select('*').order('end_date', { ascending: true }),
      supabase.from('transactions').select('*').order('date', { ascending: false, nullsFirst: false }),
      supabase.from('cash_received').select('*').order('date', { ascending: true }),
      supabase.from('projects').select('*').order('start_date', { ascending: false }),
      supabase.from('project_receipts').select('*').order('date', { ascending: false }),
      supabase.from('planned_transactions').select('*').order('start_date', { ascending: true }),
    ]);
    // Missing tables (migration not yet applied) shouldn't block the rest of
    // the dashboard; only surface other errors.
    const optionalTables = /planned_transactions|projects|project_receipts/;
    const firstError = t.error ?? tx.error ?? cr.error
      ?? (pr.error && !optionalTables.test(pr.error.message) ? pr.error : null)
      ?? (prr.error && !optionalTables.test(prr.error.message) ? prr.error : null)
      ?? (pl.error && !optionalTables.test(pl.error.message) ? pl.error : null);
    if (firstError) setError(firstError.message);

    setTrips((t.data as Trip[]) ?? []);
    setTransactions((tx.data as Transaction[]) ?? []);
    setCashReceived((cr.data as CashReceived[]) ?? []);
    setProjects((pr.data as Project[]) ?? []);
    setProjectReceipts((prr.data as ProjectReceipt[]) ?? []);
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

  return {
    trips, transactions, cashReceived, projects, projectReceipts, planned,
    loading, error, reload,
  };
}
