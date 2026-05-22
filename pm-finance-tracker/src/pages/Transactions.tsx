import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { CATEGORIES, FUNDING_SOURCES } from '../lib/constants';
import { formatDate, formatSigned, monthKey, monthLabel } from '../lib/format';
import type { Transaction } from '../lib/types';

const PAGE_SIZE = 50;

export default function Transactions() {
  const { transactions, trips, reload, loading } = useFinanceData();
  const isAdmin = useIsAdmin();
  const [params, setParams] = useSearchParams();

  const filterMonth = params.get('month') ?? '';
  const filterTrip = params.get('trip') ?? '';
  const filterCategory = params.get('category') ?? '';
  const filterSource = params.get('source') ?? '';
  const draftsOnly = params.get('filter') === 'drafts';
  const page = parseInt(params.get('page') ?? '1', 10);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setParams(next);
  }

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (draftsOnly && t.date) return false;
      if (filterMonth && (!t.date || monthKey(t.date) !== filterMonth)) return false;
      if (filterTrip && t.trip_id !== filterTrip) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterSource && t.funding_source !== filterSource) return false;
      return true;
    });
  }, [transactions, draftsOnly, filterMonth, filterTrip, filterCategory, filterSource]);

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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted">
          {filtered.length} of {transactions.length} shown
          {draftsOnly && ' · drafts only'}
        </p>
      </header>

      <div className="card-pad grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="label">Month</label>
          <select className="input" value={filterMonth}
            onChange={(e) => updateParam('month', e.target.value)}>
            <option value="">All</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Trip</label>
          <select className="input" value={filterTrip}
            onChange={(e) => updateParam('trip', e.target.value)}>
            <option value="">All</option>
            {trips.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={filterCategory}
            onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" value={filterSource}
            onChange={(e) => updateParam('source', e.target.value)}>
            <option value="">All</option>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-secondary w-full" onClick={() => setParams(new URLSearchParams())}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left bg-canvas/40">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Trip</th>
              <th className="px-4 py-2 font-medium">Bill</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
              {isAdmin && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-4 py-6 text-muted text-center">Loading…</td></tr>
            )}
            {!loading && pageRows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-muted text-center">No transactions match.</td></tr>
            )}
            {pageRows.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-2">
                  {t.date ? formatDate(t.date) : (
                    <span className="chip bg-amber-100 text-amber-800">draft</span>
                  )}
                </td>
                <td className="px-4 py-2">{t.description}</td>
                <td className="px-4 py-2">
                  <span className="chip bg-canvas border border-line">{t.funding_source}</span>
                </td>
                <td className="px-4 py-2 text-muted">{t.category}{t.subcategory ? ` · ${t.subcategory}` : ''}</td>
                <td className="px-4 py-2 text-muted">
                  {t.trip_id ? tripMap.get(t.trip_id)?.name ?? '—' : '—'}
                </td>
                <td className="px-4 py-2 text-muted">{t.bill_status || '—'}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${t.amount >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatSigned(t.amount)}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setEditing(t)}>Edit</button>
                    <button className="text-xs text-muted hover:text-expense"
                      onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-muted">
          <div>Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}>Previous</button>
            <button className="btn-secondary" disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}>Next</button>
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit transaction">
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
