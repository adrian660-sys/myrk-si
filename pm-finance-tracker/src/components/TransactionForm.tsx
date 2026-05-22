import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  CATEGORIES,
  BILL_STATUSES,
  FUNDING_SOURCES,
  PER_DIEM_RATE,
  REMOTE_WORK_RATE,
  SUBCATEGORIES,
} from '../lib/constants';
import type {
  BillStatus,
  Category,
  FundingSource,
  Transaction,
  Trip,
} from '../lib/types';
import { todayIso } from '../lib/format';

interface Props {
  trips: Trip[];
  initial?: Transaction | null;
  onSaved: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({ trips, initial, onSaved, onCancel }: Props) {
  const editing = !!initial;

  const [date, setDate] = useState<string>(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fundingSource, setFundingSource] =
    useState<FundingSource>(initial?.funding_source ?? 'Cash');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'Travel');
  const [subcategory, setSubcategory] = useState<string>(initial?.subcategory ?? '');
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : '');
  const [direction, setDirection] = useState<'in' | 'out'>(
    (initial?.amount ?? -1) >= 0 ? 'in' : 'out'
  );
  const [days, setDays] = useState<string>('');
  const [billStatus, setBillStatus] = useState<BillStatus>(initial?.bill_status ?? '/');
  const [tripId, setTripId] = useState<string>(initial?.trip_id ?? '');
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subs = SUBCATEGORIES[category];
  const isFixedRate = subcategory === 'Per Diem' || subcategory === 'Remote Work';
  const rate = subcategory === 'Per Diem' ? PER_DIEM_RATE : REMOTE_WORK_RATE;

  useEffect(() => {
    // Reset subcategory when category changes.
    if (subs.length && !subs.includes(subcategory)) setSubcategory(subs[0] ?? '');
    if (!subs.length) setSubcategory('');
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFixedRate && days) {
      const n = parseInt(days, 10);
      if (!Number.isNaN(n)) setAmount(String(n * rate));
    }
  }, [days, isFixedRate, rate]);

  const finalAmount = useMemo(() => {
    const raw = parseFloat(amount);
    if (Number.isNaN(raw)) return NaN;
    const sign = category === 'Income' ? 1 : direction === 'in' ? 1 : -1;
    return Math.abs(raw) * sign;
  }, [amount, direction, category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!description.trim()) { setError('Description is required.'); return; }
    if (Number.isNaN(finalAmount) || finalAmount === 0) {
      setError('Enter a non-zero amount.'); return;
    }

    setSaving(true);
    const payload = {
      date: date || null,
      description: description.trim(),
      funding_source: fundingSource,
      category,
      subcategory: subcategory || null,
      amount: finalAmount,
      notes: isFixedRate && days ? `${days} day(s) @ ${rate}€${notes ? ' — ' + notes : ''}` : notes || null,
      bill_status: billStatus,
      trip_id: tripId || null,
      import_source: 'manual' as const,
    };

    const { error: err } = editing
      ? await supabase.from('transactions').update(payload).eq('id', initial!.id)
      : await supabase.from('transactions').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={date}
            onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Funding source</label>
          <select className="input" value={fundingSource}
            onChange={(e) => setFundingSource(e.target.value as FundingSource)}>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Hotel Zurich 4 nights" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category}
            onChange={(e) => setCategory(e.target.value as Category)}>
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

      {isFixedRate ? (
        <div className="rounded-md border border-line bg-canvas p-3">
          <label className="label">How many days? (€{rate}/day)</label>
          <input className="input" type="number" min={0} step={1}
            value={days} onChange={(e) => setDays(e.target.value)}
            placeholder="e.g. 4" />
          <div className="mt-2 text-sm text-muted">
            Calculated amount: <span className="font-medium text-ink">
              {Number.isFinite(finalAmount) ? finalAmount.toFixed(2) : '—'} €
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">Amount (€)</label>
            <input className="input" type="number" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
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
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Trip (optional)</label>
          <select className="input" value={tripId}
            onChange={(e) => setTripId(e.target.value)}>
            <option value="">—</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {t.city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Bill</label>
          <select className="input" value={billStatus}
            onChange={(e) => setBillStatus(e.target.value as BillStatus)}>
            {BILL_STATUSES.map((b) => (
              <option key={b || 'missing'} value={b}>{b || '(missing)'}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-[60px]" value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <div className="text-sm text-expense">{error}</div>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
