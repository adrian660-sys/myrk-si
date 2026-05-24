import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { BILL_STATUSES, FUNDING_SOURCES, PER_DIEM_RATE, REMOTE_WORK_RATE } from '../lib/constants';
import type {
  BillStatus,
  Category,
  FundingSource,
  Transaction,
  Trip,
} from '../lib/types';
import { formatEur, formatPlainAmount, todayIso } from '../lib/format';

interface Props {
  trips: Trip[];
  categories: Category[];
  subcategories: Record<string, string[]>;
  initial?: Transaction | null;
  onSaved: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({
  trips,
  categories,
  subcategories: SUBCATEGORIES,
  initial,
  onSaved,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const editing = !!initial;

  const [date, setDate] = useState<string>(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? '');
  const [fundingSource, setFundingSource] =
    useState<FundingSource>(initial?.funding_source ?? 'Cash');
  const [category, setCategory] = useState<Category>(
    initial?.category ?? categories[0] ?? 'Travel'
  );
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
    // Subcategory is mandatory for every category that has subcategories
    // defined (Income / Business / Travel). Only Transfer is exempt.
    if (subs.length > 0 && !subcategory) {
      setError(t('transactionForm.subcategoryRequired')); return;
    }
    if (Number.isNaN(finalAmount) || finalAmount === 0) {
      setError(t('transactionForm.enterNonZeroAmount')); return;
    }

    setSaving(true);
    const payload = {
      date: date || null,
      description: description.trim() || '—',
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
          <label className="label">{t('transactionForm.fundingSource')}</label>
          <select className="input" value={fundingSource}
            onChange={(e) => setFundingSource(e.target.value as FundingSource)}>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">{t('common.description')} <span className="text-muted">{t('common.optional')}</span></label>
        <input className="input" value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('transactionForm.descriptionPlaceholder')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={category}
            onChange={(e) => setCategory(e.target.value as Category)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
          <label className="label">{t('transactionForm.howManyDays', { rate: formatPlainAmount(rate) })}</label>
          <input className="input" type="number" min={0} step={1}
            value={days} onChange={(e) => setDays(e.target.value)}
            placeholder={t('transactionForm.daysPlaceholder')} />
          <div className="mt-2 text-sm text-muted">
            {t('transactionForm.calculatedAmount')} <span className="font-medium text-ink">
              {Number.isFinite(finalAmount) ? formatEur(finalAmount) : '—'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="label">{t('common.amountEur')}</label>
            <input className="input" type="number" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('common.direction')}</label>
            <select className="input" value={direction}
              onChange={(e) => setDirection(e.target.value as 'in' | 'out')}
              disabled={category === 'Income'}>
              <option value="out">{t('common.directionOut')}</option>
              <option value="in">{t('common.directionIn')}</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('transactionForm.tripOptional')}</label>
          <select className="input" value={tripId}
            onChange={(e) => setTripId(e.target.value)}>
            <option value="">—</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {t.city}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('transactionForm.bill')}</label>
          <select className="input" value={billStatus}
            onChange={(e) => setBillStatus(e.target.value as BillStatus)}>
            {BILL_STATUSES.map((b) => (
              <option key={b || 'missing'} value={b}>{b || t('transactionForm.missingBill')}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input min-h-[60px]" value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <div className="text-sm text-expense">{error}</div>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : editing ? t('transactionForm.saveChanges') : t('transactionForm.addTransaction')}
        </button>
      </div>
    </form>
  );
}
