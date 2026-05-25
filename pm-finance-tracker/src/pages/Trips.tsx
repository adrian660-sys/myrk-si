import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { computeTripBalances } from '../lib/tripBalance';
import { formatDate, formatEur, todayIso } from '../lib/format';
import { FUNDING_SOURCES } from '../lib/constants';
import type { FundingSource, Trip } from '../lib/types';

export default function Trips() {
  const { t } = useTranslation();
  const { trips, transactions, cashReceived, reload, loading } = useFinanceData();
  const isAdmin = useIsAdmin();

  const balances = useMemo(
    () => computeTripBalances(trips, transactions, cashReceived),
    [trips, transactions, cashReceived]
  );

  const [tripModal, setTripModal] = useState<{ trip: Trip | null } | null>(null);
  const [cashModal, setCashModal] = useState<Trip | null>(null);

  async function deleteTrip(id: string) {
    if (!window.confirm('Delete this trip? Transactions linked to it will be un-linked.')) return;
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    reload();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t('trips.title')}</h1>
          <p className="text-sm text-muted">{t('trips.subtitle')}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setTripModal({ trip: null })}>
            {t('trips.newTrip')}
          </button>
        )}
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t('nav.trips')}</th>
              <th className="px-4 py-2 font-medium">{t('trips.dates')}</th>
              <th className="px-4 py-2 font-medium text-right">{t('trips.freshCash')}</th>
              <th className="px-4 py-2 font-medium text-right">{t('trips.cashSpent')}</th>
              <th className="px-4 py-2 font-medium text-right">{t('trips.lastBalance')}</th>
              {isAdmin && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted text-center">{t('common.loading')}</td></tr>
            )}
            {!loading && balances.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted text-center">{t('trips.noTrips')}</td></tr>
            )}
            {balances.map((b) => (
              <tr key={b.trip.id} className="border-t border-line">
                <td className="px-4 py-2">
                  <div className="font-medium">{b.trip.name}</div>
                  <div className="text-xs text-muted">{b.trip.city}</div>
                </td>
                <td className="px-4 py-2 text-muted">
                  {formatDate(b.trip.start_date)} – {formatDate(b.trip.end_date)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{formatEur(b.freshCash)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-expense">−{formatEur(b.cashExpenses)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{formatEur(b.lastBalance)}</td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setCashModal(b.trip)}>{t('trips.addCash')}</button>
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setTripModal({ trip: b.trip })}>{t('common.edit')}</button>
                    <button className="text-xs text-muted hover:text-expense"
                      onClick={() => deleteTrip(b.trip.id)}>{t('common.delete')}</button>
                  </td>
                )}
              </tr>
            ))}
            {balances.length > 1 && (() => {
              const n = balances.length;
              const avgFresh = balances.reduce((s, b) => s + b.freshCash, 0) / n;
              const avgExp = balances.reduce((s, b) => s + b.cashExpenses, 0) / n;
              return (
                <tr className="border-t-2 border-line bg-canvas/40">
                  <td className="px-4 py-2 text-xs text-muted uppercase tracking-wide">{t('trips.avgPerTrip')}</td>
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2 text-right tabular-nums text-muted">{formatEur(avgFresh)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">−{formatEur(avgExp)}</td>
                  <td className="px-4 py-2" />
                  {isAdmin && <td className="px-4 py-2" />}
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!tripModal}
        onClose={() => setTripModal(null)}
        title={tripModal?.trip ? t('trips.editTripTitle') : t('trips.newTripTitle')}
      >
        {tripModal && (
          <TripForm
            initial={tripModal.trip}
            onSaved={() => { setTripModal(null); reload(); }}
            onCancel={() => setTripModal(null)}
          />
        )}
      </Modal>

      <Modal open={!!cashModal} onClose={() => setCashModal(null)} title={t('trips.addCashTitle')}>
        {cashModal && (
          <CashReceivedForm
            trip={cashModal}
            onSaved={() => { setCashModal(null); reload(); }}
            onCancel={() => setCashModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function TripForm({
  initial, onSaved, onCancel,
}: {
  initial: Trip | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayIso());
  const [endDate, setEndDate] = useState(initial?.end_date ?? todayIso());
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !city.trim()) { setError(t('trips.nameAndCityRequired')); return; }
    if (endDate < startDate) { setError(t('common.endBeforeStart')); return; }

    setSaving(true);
    const payload = {
      name: name.trim(),
      city: city.trim(),
      start_date: startDate,
      end_date: endDate,
      notes: notes || null,
    };
    const { error: err } = initial
      ? await supabase.from('trips').update(payload).eq('id', initial.id)
      : await supabase.from('trips').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t('common.name')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('trips.city')}</label>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('common.start')}</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('common.end')}</label>
          <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : initial ? t('trips.saveTrip') : t('trips.createTrip')}
        </button>
      </div>
    </form>
  );
}

function CashReceivedForm({
  trip, onSaved, onCancel,
}: {
  trip: Trip;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(trip.start_date);
  const [source, setSource] = useState<FundingSource>('Cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) { setError(t('common.enterPositiveAmount')); return; }
    setSaving(true);
    const { error: err } = await supabase.from('cash_received').insert({
      trip_id: trip.id, amount: n, date, funding_source: source,
      notes: notes || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm text-muted">
        {t('trips.tripLabel')} <span className="text-ink font-medium">{trip.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('common.amountEur')}</label>
          <input className="input" type="number" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('common.receivedVia')}</label>
          <select className="input" value={source}
            onChange={(e) => setSource(e.target.value as FundingSource)}>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t('common.date')}</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('common.notes')}</label>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : t('common.recordReceipt')}
        </button>
      </div>
    </form>
  );
}
