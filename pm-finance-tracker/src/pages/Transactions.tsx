import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { CATEGORIES, FUNDING_SOURCES, SUBCATEGORIES } from '../lib/constants';
import { formatDate, formatSigned, monthKey, monthLabel } from '../lib/format';
import { downloadTransactionsCsv } from '../lib/csv';
import type { Transaction } from '../lib/types';

const PAGE_SIZE = 50;

export default function Transactions() {
  const { t: tr } = useTranslation();
  const { transactions, trips, reload, loading } = useFinanceData();
  const isAdmin = useIsAdmin();
  const [params, setParams] = useSearchParams();

  const filterMonth = params.get('month') ?? '';
  const filterTrip = params.get('trip') ?? '';
  const filterCategory = params.get('category') ?? '';
  const filterSubcategory = params.get('subcategory') ?? '';
  const filterSource = params.get('source') ?? '';
  const draftsOnly = params.get('filter') === 'drafts';
  const travelNoTripOnly = params.get('warn') === 'travel-no-trip';
  const page = parseInt(params.get('page') ?? '1', 10);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    if (key === 'category') next.delete('subcategory');
    setParams(next);
  }

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);

  const subcategoryOptions = useMemo(() => {
    if (filterCategory && filterCategory in SUBCATEGORIES) {
      return SUBCATEGORIES[filterCategory as keyof typeof SUBCATEGORIES];
    }
    return [...new Set(Object.values(SUBCATEGORIES).flat())];
  }, [filterCategory]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (draftsOnly && t.date) return false;
      if (travelNoTripOnly && (t.category !== 'Travel' || t.trip_id)) return false;
      if (filterMonth && (!t.date || monthKey(t.date) !== filterMonth)) return false;
      if (filterTrip && t.trip_id !== filterTrip) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterSubcategory && t.subcategory !== filterSubcategory) return false;
      if (filterSource && t.funding_source !== filterSource) return false;
      return true;
    });
  }, [transactions, draftsOnly, travelNoTripOnly, filterMonth, filterTrip, filterCategory, filterSubcategory, filterSource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) if (t.date) set.add(monthKey(t.date));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [editing, setEditing] = useState<Transaction | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this transaction?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    reload();
  }

  const filterHint = [filterMonth, filterCategory, filterSubcategory, filterSource]
    .filter(Boolean).join('_') || (draftsOnly ? 'drafts' : 'all');

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{tr('transactions.title')}</h1>
          <p className="text-sm text-muted">
            {tr('transactions.shown', { filtered: filtered.length, total: transactions.length })}
            {draftsOnly && ` ${tr('transactions.draftsOnly')}`}
            {travelNoTripOnly && ` ${tr('transactions.travelWithoutTrip')}`}
          </p>
        </div>
        <button
          className="btn-secondary"
          disabled={filtered.length === 0}
          onClick={() => downloadTransactionsCsv(filtered, trips, filterHint)}
          title="Download the rows currently shown as CSV"
        >
          {tr('common.exportCsv')}
        </button>
      </header>

      <div className="card-pad grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="label">{tr('transactions.month')}</label>
          <select className="input" value={filterMonth}
            onChange={(e) => updateParam('month', e.target.value)}>
            <option value="">{tr('common.all')}</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{tr('transactions.trip')}</label>
          <select className="input" value={filterTrip}
            onChange={(e) => updateParam('trip', e.target.value)}>
            <option value="">{tr('common.all')}</option>
            {trips.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{tr('common.category')}</label>
          <select className="input" value={filterCategory}
            onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">{tr('common.all')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{tr('common.subcategory')}</label>
          <select className="input" value={filterSubcategory}
            onChange={(e) => updateParam('subcategory', e.target.value)}>
            <option value="">{tr('common.all')}</option>
            {subcategoryOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{tr('common.source')}</label>
          <select className="input" value={filterSource}
            onChange={(e) => updateParam('source', e.target.value)}>
            <option value="">{tr('common.all')}</option>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-secondary w-full" onClick={() => setParams(new URLSearchParams())}>
            {tr('transactions.clearFilters')}
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left bg-canvas/40">
            <tr>
              <th className="px-4 py-2 font-medium">{tr('common.date')}</th>
              <th className="px-4 py-2 font-medium">{tr('common.source')}</th>
              <th className="px-4 py-2 font-medium">{tr('common.category')}</th>
              <th className="px-4 py-2 font-medium">{tr('common.subcategory')}</th>
              <th className="px-4 py-2 font-medium">{tr('transactions.trip')}</th>
              <th className="px-4 py-2 font-medium text-right">{tr('common.amount')}</th>
              <th className="px-4 py-2 font-medium">{tr('common.description')}</th>
              {isAdmin && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-4 py-6 text-muted text-center">{tr('common.loading')}</td></tr>
            )}
            {!loading && pageRows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-muted text-center">{tr('common.noMatch')}</td></tr>
            )}
            {pageRows.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-2">
                  {t.date ? formatDate(t.date) : (
                    <span className="chip bg-amber-100 text-amber-800">{tr('transactions.draft')}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className="chip bg-canvas border border-line">{t.funding_source}</span>
                </td>
                <td className="px-4 py-2 text-muted">{t.category}</td>
                <td className="px-4 py-2 text-muted">{t.subcategory ?? tr('common.dash')}</td>
                <td className="px-4 py-2 text-muted">
                  {t.trip_id ? tripMap.get(t.trip_id)?.name ?? tr('common.dash') : tr('common.dash')}
                </td>
                <td className={`px-4 py-2 text-right tabular-nums ${t.amount >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatSigned(t.amount)}
                </td>
                <td className="px-4 py-2 text-muted">{t.description || tr('common.dash')}</td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setEditing(t)}>{tr('common.edit')}</button>
                    <button className="text-xs text-muted hover:text-expense"
                      onClick={() => handleDelete(t.id)}>{tr('common.delete')}</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-muted">
          <div>{tr('transactions.page', { page, total: totalPages })}</div>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}>{tr('transactions.previous')}</button>
            <button className="btn-secondary" disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}>{tr('transactions.next')}</button>
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={tr('transactions.editTransaction')}>
        {editing && (
          <TransactionForm
            initial={editing}
            trips={trips}
            onSaved={() => { setEditing(null); reload(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
