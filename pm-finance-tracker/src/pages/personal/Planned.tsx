import { useMemo, useState, type FormEvent } from 'react';
import Modal from '../../components/Modal';
import { usePersonalFinanceData } from '../../hooks/usePersonalFinanceData';
import { personalAmountSignChoice, personalCategoryTypeOf, personalSignedAmount } from '../../lib/personal/amounts';
import { notifyPersonalChanged, PT } from '../../lib/personal/tables';
import {
  personalCategoryName,
  personalFundingSourceName,
  personalSubcategoriesForCategory,
} from '../../lib/personal/lookups';
import { formatDate, formatSigned } from '../../lib/format';
import { personalNextDueDate, personalTodayIsoLocal } from '../../lib/personal/planned';
import { supabase } from '../../lib/supabase';
import type {
  PersonalCategory,
  PersonalFundingSource,
  PersonalPlannedFrequency,
  PersonalPlannedTransaction,
  PersonalSubcategory,
} from '../../lib/personal/types';
import { useTranslation } from 'react-i18next';

export default function PersonalPlanned() {
  const { t } = useTranslation();
  const { planned, categories, subcategories, fundingSources, reload, loading } =
    usePersonalFinanceData();
  const [editing, setEditing] = useState<PersonalPlannedTransaction | null | 'new'>(null);
  const today = personalTodayIsoLocal();

  const rows = useMemo(() => {
    return [...planned].sort((a, b) => {
      const na = personalNextDueDate(a, today) ?? '9999-12-31';
      const nb = personalNextDueDate(b, today) ?? '9999-12-31';
      return na.localeCompare(nb);
    });
  }, [planned, today]);

  async function toggleActive(p: PersonalPlannedTransaction) {
    const { error } = await supabase
      .from(PT.planned_transactions)
      .update({ active: !p.active })
      .eq('id', p.id);
    if (error) alert(error.message);
    else {
      notifyPersonalChanged();
      reload();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this planned item?')) return;
    const { error } = await supabase.from(PT.planned_transactions).delete().eq('id', id);
    if (error) alert(error.message);
    else {
      notifyPersonalChanged();
      reload();
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Planned & recurring</h1>
          <p className="text-sm text-muted">Scheduled transactions with auto-calculated next due date</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          {t('personal.addPlanned')}
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Frequency</th>
                <th className="px-4 py-2">Next due</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 w-28" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No planned transactions yet.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const due = personalNextDueDate(p, today);
                  const overdue = due && due < today;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-line last:border-0 ${
                        !p.active ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-4 py-2">{p.description}</td>
                      <td
                        className={`px-4 py-2 text-right tabular-nums ${
                          p.amount >= 0 ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {formatSigned(p.amount)}
                      </td>
                      <td className="px-4 py-2 capitalize">{p.frequency}</td>
                      <td className={`px-4 py-2 ${overdue ? 'text-expense font-medium' : ''}`}>
                        {due ? formatDate(due) : '—'}
                        {overdue && p.active && (
                          <span className="ml-1 text-xs">(overdue)</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{personalCategoryName(p.category_id, categories)}</td>
                      <td className="px-4 py-2">
                        {personalFundingSourceName(p.funding_source_id, fundingSources)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`chip ${
                            p.active ? 'bg-income/10 text-income' : 'bg-canvas text-muted'
                          }`}
                        >
                          {p.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button className="btn-secondary text-xs" onClick={() => toggleActive(p)}>
                            {p.active ? t('personal.pause') : t('personal.resume')}
                          </button>
                          <button className="btn-secondary text-xs" onClick={() => setEditing(p)}>
                            {t('common.edit')}
                          </button>
                          <button className="btn-danger text-xs" onClick={() => handleDelete(p.id)}>
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add planned transaction' : 'Edit planned transaction'}
        wide
      >
        {editing !== null && (
          <PlannedForm
            planned={editing === 'new' ? null : editing}
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

function PlannedForm({
  planned,
  categories,
  subcategories,
  fundingSources,
  onSaved,
  onCancel,
}: {
  planned: PersonalPlannedTransaction | null;
  categories: PersonalCategory[];
  subcategories: PersonalSubcategory[];
  fundingSources: PersonalFundingSource[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!planned?.id;
  const [description, setDescription] = useState(planned?.description ?? '');
  const [rawAmount, setRawAmount] = useState(
    planned ? String(Math.abs(planned.amount)) : ''
  );
  const [sign, setSign] = useState<'+' | '-'>(
    planned ? personalAmountSignChoice(planned.amount) : '-'
  );
  const [categoryId, setCategoryId] = useState(planned?.category_id ?? '');
  const [subcategoryId, setSubcategoryId] = useState(planned?.subcategory_id ?? '');
  const [fundingSourceId, setFundingSourceId] = useState(planned?.funding_source_id ?? '');
  const [frequency, setFrequency] = useState<PersonalPlannedFrequency>(
    planned?.frequency ?? 'monthly'
  );
  const [startDate, setStartDate] = useState(planned?.start_date ?? '');
  const [endDate, setEndDate] = useState(planned?.end_date ?? '');
  const [active, setActive] = useState(planned?.active ?? true);
  const [notes, setNotes] = useState(planned?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const catType = personalCategoryTypeOf(categoryId, categories);
  const subs = personalSubcategoriesForCategory(categoryId, subcategories);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(rawAmount);
    if (!description || !categoryId || !fundingSourceId || !startDate || Number.isNaN(parsed)) {
      setError('Please fill required fields.');
      return;
    }
    const amount = personalSignedAmount(parsed, catType, sign);
    setSaving(true);
    const payload = {
      description,
      amount,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      funding_source_id: fundingSourceId,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      active,
      notes: notes || null,
    };
    const { error: err } = isEdit
      ? await supabase.from(PT.planned_transactions).update(payload).eq('id', planned!.id)
      : await supabase.from(PT.planned_transactions).insert(payload);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    notifyPersonalChanged();
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Description</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount</label>
          <input className="input" type="number" step="0.01" min="0" value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)} required />
        </div>
        {catType !== 'income' && (
          <div>
            <label className="label">Sign</label>
            <select className="input" value={sign} onChange={(e) => setSign(e.target.value as '+' | '-')}>
              <option value="-">Expense</option>
              <option value="+">Income</option>
            </select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Subcategory</label>
          <select className="input" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
            <option value="">—</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Funding source</label>
        <select className="input" value={fundingSourceId} onChange={(e) => setFundingSourceId(e.target.value)} required>
          <option value="">Select…</option>
          {fundingSources.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Frequency</label>
          <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as PersonalPlannedFrequency)}>
            <option value="once">Once</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="label">Active</label>
          <select className="input" value={active ? '1' : '0'} onChange={(e) => setActive(e.target.value === '1')}>
            <option value="1">Active</option>
            <option value="0">Paused</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{frequency === 'once' ? 'Due date' : 'Start date'}</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        {frequency !== 'once' && (
          <div>
            <label className="label">End date (optional)</label>
            <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}
