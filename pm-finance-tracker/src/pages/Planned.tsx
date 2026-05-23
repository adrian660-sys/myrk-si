import { useMemo, useState } from 'react';
import Modal from '../components/Modal';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  CATEGORIES, FUNDING_SOURCES, SUBCATEGORIES,
} from '../lib/constants';
import { formatDate, formatSigned, todayIso } from '../lib/format';
import { expandOccurrences, todayIsoLocal, addDays } from '../lib/planned';
import type {
  Category, FundingSource, PlannedFrequency, PlannedTransaction,
} from '../lib/types';

const FREQUENCIES: { value: PlannedFrequency; label: string }[] = [
  { value: 'once',      label: 'One-off (single due date)' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly' },
];

export default function Planned() {
  const { planned, reload, loading } = useFinanceData();
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState<PlannedTransaction | null | 'new'>(null);

  const rows = useMemo(() => {
    const today = todayIsoLocal();
    const horizon = addDays(today, 365);
    return planned.map((p) => {
      const next = expandOccurrences(p, today, horizon)[0]?.due_date ?? null;
      return { p, next };
    });
  }, [planned]);

  async function deletePlanned(id: string) {
    if (!confirm('Delete this scheduled item?')) return;
    const { error } = await supabase.from('planned_transactions').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    reload();
  }

  async function toggleActive(p: PlannedTransaction) {
    const { error } = await supabase
      .from('planned_transactions')
      .update({ active: !p.active })
      .eq('id', p.id);
    if (error) { alert(error.message); return; }
    reload();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Planned & recurring</h1>
          <p className="text-sm text-muted">
            Bills with a due date and recurring expenses. Used to project cash flow
            and surface upcoming payments — they are <em>not</em> auto-posted as
            transactions.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setEditing('new')}>+ New</button>
        )}
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Frequency</th>
              <th className="px-4 py-2 font-medium">Next due</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              {isAdmin && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-4 py-6 text-muted text-center">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-muted text-center">
                Nothing scheduled yet.
              </td></tr>
            )}
            {rows.map(({ p, next }) => (
              <tr key={p.id} className={`border-t border-line ${!p.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2">
                  <div className="font-medium">{p.description}</div>
                  {p.notes && <div className="text-xs text-muted">{p.notes}</div>}
                </td>
                <td className="px-4 py-2">
                  <span className="chip bg-canvas border border-line">{p.funding_source}</span>
                </td>
                <td className="px-4 py-2 text-muted">
                  {p.category}{p.subcategory ? ` · ${p.subcategory}` : ''}
                </td>
                <td className="px-4 py-2 text-muted">{labelFreq(p.frequency)}</td>
                <td className="px-4 py-2">{next ? formatDate(next) : '—'}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${p.amount >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatSigned(p.amount)}
                </td>
                <td className="px-4 py-2">
                  {p.active
                    ? <span className="chip bg-emerald-100 text-emerald-800">active</span>
                    : <span className="chip bg-gray-200 text-gray-700">paused</span>}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => toggleActive(p)}>
                      {p.active ? 'Pause' : 'Resume'}
                    </button>
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setEditing(p)}>Edit</button>
                    <button className="text-xs text-muted hover:text-expense"
                      onClick={() => deletePlanned(p.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New scheduled item' : 'Edit scheduled item'}
      >
        {editing && (
          <PlannedForm
            initial={editing === 'new' ? null : editing}
            onSaved={() => { setEditing(null); reload(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function labelFreq(f: PlannedFrequency): string {
  return FREQUENCIES.find((x) => x.value === f)?.label ?? f;
}

function PlannedForm({
  initial, onSaved, onCancel,
}: {
  initial: PlannedTransaction | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fundingSource, setFundingSource] =
    useState<FundingSource>(initial?.funding_source ?? 'DH');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'Business');
  const [subcategory, setSubcategory] =
    useState<string>(initial?.subcategory ?? SUBCATEGORIES['Business'][0] ?? '');
  const [amountAbs, setAmountAbs] = useState<string>(
    initial ? String(Math.abs(initial.amount)) : ''
  );
  const [direction, setDirection] = useState<'in' | 'out'>(
    (initial?.amount ?? -1) >= 0 ? 'in' : 'out'
  );
  const [frequency, setFrequency] = useState<PlannedFrequency>(initial?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayIso());
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subs = SUBCATEGORIES[category];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!description.trim()) { setError('Description is required.'); return; }
    const n = parseFloat(amountAbs);
    if (Number.isNaN(n) || n <= 0) { setError('Enter a positive amount.'); return; }
    if (endDate && endDate < startDate) { setError('End date is before start date.'); return; }

    const signed = (category === 'Income' || direction === 'in') ? Math.abs(n) : -Math.abs(n);

    setSaving(true);
    const payload = {
      description: description.trim(),
      funding_source: fundingSource,
      category,
      subcategory: subcategory || null,
      amount: signed,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      active,
      notes: notes || null,
    };
    const { error: err } = initial
      ? await supabase.from('planned_transactions').update(payload).eq('id', initial.id)
      : await supabase.from('planned_transactions').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Description</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Računovodja, ZZZS, Tax Q2" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Funding source</label>
          <select className="input" value={fundingSource}
            onChange={(e) => setFundingSource(e.target.value as FundingSource)}>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Frequency</label>
          <select className="input" value={frequency}
            onChange={(e) => setFrequency(e.target.value as PlannedFrequency)}>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category}
            onChange={(e) => {
              const c = e.target.value as Category;
              setCategory(c);
              setSubcategory(SUBCATEGORIES[c][0] ?? '');
            }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subcategory</label>
          <select className="input" value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={subs.length === 0}>
            {subs.length === 0
              ? <option value="">—</option>
              : subs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label">Amount (€)</label>
          <input className="input" type="number" step="0.01" min="0"
            value={amountAbs} onChange={(e) => setAmountAbs(e.target.value)} />
        </div>
        <div>
          <label className="label">Direction</label>
          <select className="input" value={direction}
            onChange={(e) => setDirection(e.target.value as 'in' | 'out')}
            disabled={category === 'Income'}>
            <option value="out">Out</option>
            <option value="in">In</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">
            {frequency === 'once' ? 'Due date' : 'First due date'}
          </label>
          <input className="input" type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} />
        </div>
        {frequency !== 'once' && (
          <div>
            <label className="label">End date (optional)</label>
            <input className="input" type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
      </div>

      <div>
        <label className="label">Notes</label>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>

      {error && <div className="text-sm text-expense">{error}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}
