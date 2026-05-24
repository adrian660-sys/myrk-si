import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  personalAmountSignChoice,
  personalCategoryTypeOf,
  personalSignedAmount,
} from '../../lib/personal/amounts';
import { personalSubcategoriesForCategory } from '../../lib/personal/lookups';
import { notifyPersonalChanged, PT } from '../../lib/personal/tables';
import type {
  PersonalCategory,
  PersonalFundingSource,
  PersonalSubcategory,
  PersonalTransaction,
} from '../../lib/personal/types';
import { supabase } from '../../lib/supabase';

interface Props {
  transaction?: PersonalTransaction | null;
  categories: PersonalCategory[];
  subcategories: PersonalSubcategory[];
  fundingSources: PersonalFundingSource[];
  onSaved: () => void;
  onCancel: () => void;
}

export default function PersonalTransactionForm({
  transaction,
  categories,
  subcategories,
  fundingSources,
  onSaved,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!transaction?.id;
  const [date, setDate] = useState(transaction?.date ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [rawAmount, setRawAmount] = useState(
    transaction ? String(Math.abs(transaction.amount)) : ''
  );
  const [sign, setSign] = useState<'+' | '-'>(
    transaction ? personalAmountSignChoice(transaction.amount) : '-'
  );
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? '');
  const [subcategoryId, setSubcategoryId] = useState(transaction?.subcategory_id ?? '');
  const [fundingSourceId, setFundingSourceId] = useState(transaction?.funding_source_id ?? '');
  const [notes, setNotes] = useState(transaction?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const catType = personalCategoryTypeOf(categoryId, categories);
  const subs = useMemo(
    () => personalSubcategoriesForCategory(categoryId, subcategories),
    [categoryId, subcategories]
  );

  useEffect(() => {
    if (catType === 'income') setSign('+');
  }, [catType]);

  useEffect(() => {
    if (subcategoryId && !subs.some((s) => s.id === subcategoryId)) setSubcategoryId('');
  }, [categoryId, subcategoryId, subs]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseFloat(rawAmount);
    if (!date || !description || !categoryId || !fundingSourceId || Number.isNaN(parsed)) {
      setError(t('personal.fillRequired'));
      return;
    }
    const amount = personalSignedAmount(parsed, catType, sign);
    setSaving(true);
    const payload = {
      date,
      description,
      amount,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      funding_source_id: fundingSourceId,
      notes: notes || null,
      import_source: transaction?.import_source ?? 'manual',
    };
    const { error: err } = isEdit
      ? await supabase.from(PT.transactions).update(payload).eq('id', transaction!.id)
      : await supabase.from(PT.transactions).insert(payload);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    notifyPersonalChanged();
    onSaved();
  }

  const expenseCats = categories.filter((c) => c.type === 'expense');
  const incomeCats = categories.filter((c) => c.type === 'income');
  const transferCats = categories.filter((c) => c.type === 'transfer');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">{t('common.date')}</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div>
        <label className="label">{t('common.description')}</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('common.amount')}</label>
          <input className="input" type="number" step="0.01" min="0" value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)} required />
        </div>
        {catType !== 'income' && (
          <div>
            <label className="label">{t('personal.sign')}</label>
            <select className="input" value={sign} onChange={(e) => setSign(e.target.value as '+' | '-')}>
              <option value="-">{t('personal.expenseSign')}</option>
              <option value="+">{t('personal.incomeSign')}</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="label">{t('common.category')}</label>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">{t('personal.select')}</option>
          {expenseCats.length > 0 && (
            <optgroup label={t('personal.typeExpense')}>
              {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          )}
          {incomeCats.length > 0 && (
            <optgroup label={t('personal.typeIncome')}>
              {incomeCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          )}
          {transferCats.length > 0 && (
            <optgroup label={t('personal.typeTransfer')}>
              {transferCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </optgroup>
          )}
        </select>
      </div>
      <div>
        <label className="label">{t('common.subcategory')}</label>
        <select className="input" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}
          disabled={!categoryId || subs.length === 0}>
          <option value="">{t('common.dash')}</option>
          {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('personal.fundingSource')}</label>
        <select className="input" value={fundingSourceId} onChange={(e) => setFundingSourceId(e.target.value)} required>
          <option value="">{t('personal.select')}</option>
          {fundingSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : isEdit ? t('personal.update') : t('personal.add')}
        </button>
      </div>
    </form>
  );
}
