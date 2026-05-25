import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildCategoryLists, type PmCategoryRow, type PmSubcategoryRow } from '../lib/categoryCatalog';
import { supabase } from '../lib/supabase';
import type {
  CashReceived, Category, PlannedPayment, PlannedTransaction, Project, ProjectReceipt, Transaction, Trip,
} from '../lib/types';

export const PM_CATALOG_CHANGED = 'pmf:catalog-changed';
export const PM_PAYMENTS_CHANGED = 'pmf:payments-changed';

export function notifyCatalogChanged() {
  window.dispatchEvent(new Event(PM_CATALOG_CHANGED));
}

export function notifyPaymentsChanged() {
  window.dispatchEvent(new Event(PM_PAYMENTS_CHANGED));
}

export interface FinanceData {
  trips: Trip[];
  transactions: Transaction[];
  cashReceived: CashReceived[];
  projects: Project[];
  projectReceipts: ProjectReceipt[];
  planned: PlannedTransaction[];
  plannedPayments: PlannedPayment[];
  pmCategories: PmCategoryRow[];
  pmSubcategories: PmSubcategoryRow[];
  categories: Category[];
  subcategories: Record<string, string[]>;
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
  const [plannedPayments, setPlannedPayments] = useState<PlannedPayment[]>([]);
  const [pmCategories, setPmCategories] = useState<PmCategoryRow[]>([]);
  const [pmSubcategories, setPmSubcategories] = useState<PmSubcategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { categories, subcategories } = useMemo(
    () => buildCategoryLists(pmCategories, pmSubcategories),
    [pmCategories, pmSubcategories]
  );

  const reload = useCallback(async () => {
    setError(null);
    const [t, tx, cr, pr, prr, pl, pp, cat, sub] = await Promise.all([
      supabase.from('trips').select('*').order('end_date', { ascending: true }),
      supabase.from('transactions').select('*').order('date', { ascending: false, nullsFirst: false }),
      supabase.from('cash_received').select('*').order('date', { ascending: true }),
      supabase.from('projects').select('*').order('start_date', { ascending: false }),
      supabase.from('project_receipts').select('*').order('date', { ascending: false }),
      supabase.from('planned_transactions').select('*').order('start_date', { ascending: true }),
      supabase.from('planned_payments').select('*'),
      supabase.from('pm_categories').select('*').order('sort_order').order('name'),
      supabase.from('pm_subcategories').select('*').order('name'),
    ]);
    const optionalTables = /planned_transactions|planned_payments|projects|project_receipts|pm_categories|pm_subcategories/;
    const firstError = t.error ?? tx.error ?? cr.error
      ?? (pr.error && !optionalTables.test(pr.error.message) ? pr.error : null)
      ?? (prr.error && !optionalTables.test(prr.error.message) ? prr.error : null)
      ?? (pl.error && !optionalTables.test(pl.error.message) ? pl.error : null)
      ?? (cat.error && !optionalTables.test(cat.error.message) ? cat.error : null)
      ?? (sub.error && !optionalTables.test(sub.error.message) ? sub.error : null);
    if (firstError) setError(firstError.message);

    setTrips((t.data as Trip[]) ?? []);
    setTransactions((tx.data as Transaction[]) ?? []);
    setCashReceived((cr.data as CashReceived[]) ?? []);
    setProjects((pr.data as Project[]) ?? []);
    setProjectReceipts((prr.data as ProjectReceipt[]) ?? []);
    setPlanned((pl.data as PlannedTransaction[]) ?? []);
    setPlannedPayments((pp.data as PlannedPayment[]) ?? []);
    setPmCategories((cat.data as PmCategoryRow[]) ?? []);
    setPmSubcategories((sub.data as PmSubcategoryRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener('pmf:transactions-changed', onChange);
    window.addEventListener('pmf:planned-changed', onChange);
    window.addEventListener(PM_CATALOG_CHANGED, onChange);
    window.addEventListener(PM_PAYMENTS_CHANGED, onChange);
    return () => {
      window.removeEventListener('pmf:transactions-changed', onChange);
      window.removeEventListener('pmf:planned-changed', onChange);
      window.removeEventListener(PM_CATALOG_CHANGED, onChange);
      window.removeEventListener(PM_PAYMENTS_CHANGED, onChange);
    };
  }, [reload]);

  return {
    trips, transactions, cashReceived, projects, projectReceipts, planned, plannedPayments,
    pmCategories, pmSubcategories, categories, subcategories,
    loading, error, reload,
  };
}
