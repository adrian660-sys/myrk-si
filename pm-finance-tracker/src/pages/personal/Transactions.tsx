import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../../components/Modal';
import PersonalTransactionForm from '../../components/personal/PersonalTransactionForm';
import { usePersonalFinanceData } from '../../hooks/usePersonalFinanceData';
import { downloadPersonalTransactionsCsv } from '../../lib/personal/csv';
import {
  personalCategoryName,
  personalFundingSourceName,
  personalSubcategoriesForCategory,
  personalSubcategoryName,
} from '../../lib/personal/lookups';
import { notifyPersonalChanged, PT } from '../../lib/personal/tables';
import { formatDate, formatSigned, monthKey, monthLabel } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import type { PersonalTransaction } from '../../lib/personal/types';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 50;

export default function PersonalTransactions() {
  const { t } = useTranslation();
  const {
    transactions,
    categories,
    subcategories,
    fundingSources,
    reload,
    loading,
  } = usePersonalFinanceData();
  const [params, setParams] = useSearchParams();

  const filterMonth = params.get('month') ?? '';
  const filterCategory = params.get('category') ?? '';
  const filterSubcategory = params.get('subcategory') ?? '';
  const filterSource = params.get('source') ?? '';
  const page = parseInt(params.get('page') ?? '1', 10);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    if (key === 'category') next.delete('subcategory');
    setParams(next);
  }

  const subcategoryOptions = useMemo(() => {
    if (filterCategory) {
      return personalSubcategoriesForCategory(filterCategory, subcategories);
    }
    return subcategories;
  }, [filterCategory, subcategories]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterMonth && monthKey(t.date) !== filterMonth) return false;
      if (filterCategory && t.category_id !== filterCategory) return false;
      if (filterSubcategory && t.subcategory_id !== filterSubcategory) return false;
      if (filterSource && t.funding_source_id !== filterSource) return false;
      return true;
    });
  }, [transactions, filterMonth, filterCategory, filterSubcategory, filterSource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(monthKey(t.date));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [editing, setEditing] = useState<PersonalTransaction | null | 'new'>(null);

  async function handleDelete(id: string) {
    if (!window.confirm(t('personal.confirmDeleteTx'))) return;
    const { error } = await supabase.from(PT.transactions).delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    notifyPersonalChanged();
    reload();
  }

  const filterHint = [filterMonth, filterCategory, filterSubcategory, filterSource]
    .filter(Boolean)
    .join('_') || 'all';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('personal.transactionsTitle')}</h1>
          <p className="text-sm text-muted">
            {filtered.length} of {transactions.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={filtered.length === 0}
            onClick={() =>
              downloadPersonalTransactionsCsv(
                filtered,
                categories,
                subcategories,
                fundingSources,
                filterHint
              )
            }
          >
            {t('common.exportCsv')}
          </button>
          <button className="btn-primary" onClick={() => setEditing('new')}>
            {t('personal.add')}
          </button>
        </div>
      </header>

      <div className="card-pad grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Month</label>
          <select
            className="input"
            value={filterMonth}
            onChange={(e) => updateParam('month', e.target.value)}
          >
            <option value="">All</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={filterCategory}
            onChange={(e) => updateParam('category', e.target.value)}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Subcategory</label>
          <select
            className="input"
            value={filterSubcategory}
            onChange={(e) => updateParam('subcategory', e.target.value)}
          >
            <option value="">All</option>
            {subcategoryOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Funding source</label>
          <select
            className="input"
            value={filterSource}
            onChange={(e) => updateParam('source', e.target.value)}
          >
            <option value="">All</option>
            {fundingSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Subcategory</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-muted text-center">
                    Loading…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-muted text-center">
                    No transactions match filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((tx) => (
                  <tr key={tx.id} className="border-b border-line last:border-0 hover:bg-canvas/50">
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-2">
                      <div>{tx.description}</div>
                      {tx.notes && <div className="text-xs text-muted">{tx.notes}</div>}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums font-medium ${
                        tx.amount >= 0 ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {formatSigned(tx.amount)}
                    </td>
                    <td className="px-4 py-2">{personalCategoryName(tx.category_id, categories)}</td>
                    <td className="px-4 py-2">{personalSubcategoryName(tx.subcategory_id, subcategories)}</td>
                    <td className="px-4 py-2">{personalFundingSourceName(tx.funding_source_id, fundingSources)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button className="btn-secondary text-xs" onClick={() => setEditing(tx)}>
                          {t('common.edit')}
                        </button>
                        <button className="btn-danger text-xs" onClick={() => handleDelete(tx.id)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
          >
            Next
          </button>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add transaction' : 'Edit transaction'}
      >
        {editing !== null && (
          <PersonalTransactionForm
            transaction={editing === 'new' ? null : editing}
            categories={categories}
            subcategories={subcategories}
            fundingSources={fundingSources}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
