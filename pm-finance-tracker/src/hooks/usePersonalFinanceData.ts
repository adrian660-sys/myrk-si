import { useCallback, useEffect, useState } from 'react';
import { PERSONAL_CHANGED, PT } from '../lib/personal/tables';
import { supabase } from '../lib/supabase';
import type {
  PersonalCategory,
  PersonalFundingSource,
  PersonalPlannedTransaction,
  PersonalSubcategory,
  PersonalTransaction,
} from '../lib/personal/types';

export interface PersonalFinanceData {
  categories: PersonalCategory[];
  subcategories: PersonalSubcategory[];
  fundingSources: PersonalFundingSource[];
  transactions: PersonalTransaction[];
  planned: PersonalPlannedTransaction[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function num(row: { amount: unknown }): number {
  return typeof row.amount === 'number' ? row.amount : Number(row.amount);
}

export function usePersonalFinanceData(): PersonalFinanceData {
  const [categories, setCategories] = useState<PersonalCategory[]>([]);
  const [subcategories, setSubcategories] = useState<PersonalSubcategory[]>([]);
  const [fundingSources, setFundingSources] = useState<PersonalFundingSource[]>([]);
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [planned, setPlanned] = useState<PersonalPlannedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [cat, sub, fs, tx, pl] = await Promise.all([
      supabase.from(PT.categories).select('*').order('type').order('name'),
      supabase.from(PT.subcategories).select('*').order('name'),
      supabase.from(PT.funding_sources).select('*').order('name'),
      supabase.from(PT.transactions).select('*').order('date', { ascending: false }),
      supabase.from(PT.planned_transactions).select('*').order('start_date', { ascending: true }),
    ]);

    const err =
      cat.error?.message ??
      sub.error?.message ??
      fs.error?.message ??
      tx.error?.message ??
      pl.error?.message ??
      null;

    if (err) setError(err);
    else {
      setCategories((cat.data ?? []) as PersonalCategory[]);
      setSubcategories((sub.data ?? []) as PersonalSubcategory[]);
      setFundingSources((fs.data ?? []) as PersonalFundingSource[]);
      setTransactions(
        ((tx.data ?? []) as PersonalTransaction[]).map((t) => ({ ...t, amount: num(t) }))
      );
      setPlanned(
        ((pl.data ?? []) as PersonalPlannedTransaction[]).map((p) => ({ ...p, amount: num(p) }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(PERSONAL_CHANGED, onChange);
    return () => window.removeEventListener(PERSONAL_CHANGED, onChange);
  }, [reload]);

  return {
    categories,
    subcategories,
    fundingSources,
    transactions,
    planned,
    loading,
    error,
    reload,
  };
}
