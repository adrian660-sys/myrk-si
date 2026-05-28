import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import KpiCard from '../components/KpiCard';
import MarkPaidModal from '../components/MarkPaidModal';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { computeTripBalances } from '../lib/tripBalance';
import { formatEur, formatSigned, formatDate, monthLabel } from '../lib/format';
import {
  projectMonths, upcomingOccurrences, isOccurrencePaid, todayIsoLocal, daysBetween,
} from '../lib/planned';
import type { PlannedOccurrence } from '../lib/types';

export default function Dashboard() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const {
    trips, transactions, cashReceived, planned, plannedPayments,
    categories, subcategories, reload, loading, error,
  } = useFinanceData();
  const [markPaidOccurrence, setMarkPaidOccurrence] = useState<PlannedOccurrence | null>(null);

  const balances = useMemo(
    () => computeTripBalances(trips, transactions, cashReceived),
    [trips, transactions, cashReceived]
  );

  const balanceBySource = useMemo(() => {
    let cash = 0, dh = 0, revolut = 0;
    for (const c of cashReceived) {
      if (c.funding_source === 'Cash') cash += c.amount;
      else if (c.funding_source === 'DH') dh += c.amount;
      else if (c.funding_source === 'Revolut') revolut += c.amount;
    }
    for (const t of transactions) {
      if (t.funding_source === 'Cash') cash += t.amount;
      else if (t.funding_source === 'DH') dh += t.amount;
      else if (t.funding_source === 'Revolut') revolut += t.amount;
    }
    return { cash, dh, revolut, total: cash + dh + revolut };
  }, [cashReceived, transactions]);

  const drafts = useMemo(() => transactions.filter((t) => !t.date), [transactions]);
  const travelNoTrip = useMemo(
    () => transactions.filter((t) => t.category === 'Travel' && !t.trip_id),
    [transactions]
  );

  const allUpcoming = useMemo(
    () => upcomingOccurrences(planned, { ahead: 30, pastDays: 14 }),
    [planned]
  );
  const today = todayIsoLocal();
  const upcoming = useMemo(
    () => allUpcoming.filter((o) => !isOccurrencePaid(plannedPayments, o.planned_id, o.due_date)),
    [allUpcoming, plannedPayments]
  );
  const overdueCount = upcoming.filter((o) => o.due_date < today).length;

  const projection = useMemo(() => projectMonths(planned, 12), [planned]);
  const projectionWithRunning = useMemo(() => {
    let runCash = balanceBySource.cash;
    let runDh = balanceBySource.dh;
    let runRevolut = balanceBySource.revolut;
    return projection.map((m) => {
      runCash += m.bySource.Cash ?? 0;
      runDh += m.bySource.DH ?? 0;
      runRevolut += m.bySource.Revolut ?? 0;
      return { ...m, runCash, runDh, runRevolut, runTotal: runCash + runDh + runRevolut };
    });
  }, [projection, balanceBySource]);

  if (loading) return <div className="p-6 text-muted">Loading…</div>;
  if (error) return <div className="p-6 text-expense">Error: {error}</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <header>
        <h1 className="font-display text-3xl text-ink">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted mt-1">{t('dashboard.subtitle')}</p>
      </header>

      <section className="space-y-3">
        <h2 className="section-heading">{t('dashboard.currentBalance')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Cash" value={balanceBySource.cash}
            tone={balanceBySource.cash >= 0 ? 'neutral' : 'expense'}
            hint={t('dashboard.cashHint')} />
          <KpiCard label="DH" value={balanceBySource.dh}
            tone={balanceBySource.dh >= 0 ? 'neutral' : 'expense'}
            hint={t('dashboard.dhHint')} />
          <KpiCard label="Revolut" value={balanceBySource.revolut}
            tone={balanceBySource.revolut >= 0 ? 'neutral' : 'expense'}
            hint={t('dashboard.revolutHint')} />
          <KpiCard label="Total" value={balanceBySource.total}
            tone={balanceBySource.total >= 0 ? 'income' : 'expense'}
            hint={t('dashboard.totalHint')} />
        </div>
      </section>

      {drafts.length > 0 && (
        <div className="card-pad border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t('dashboard.needsAttention')}</div>
              <div className="text-sm text-muted">
                {t('dashboard.draftCount', { count: drafts.length })}
              </div>
            </div>
            <Link className="btn-secondary" to="/transactions?filter=drafts">{t('common.review')}</Link>
          </div>
        </div>
      )}

      {travelNoTrip.length > 0 && (
        <div className="card-pad border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{t('dashboard.travelWithoutTrip')}</div>
              <div className="text-sm text-muted">
                {t('dashboard.travelNoTripCount', { count: travelNoTrip.length })}
              </div>
            </div>
            <Link className="btn-secondary" to="/transactions?warn=travel-no-trip">{t('common.review')}</Link>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <Collapsible
          title={
            <>
              {t('dashboard.upcomingBills')}
              {overdueCount > 0 && (
                <span className="ml-2 chip bg-red-100 text-red-800">
                  {overdueCount} {t('dashboard.overdue')}
                </span>
              )}
            </>
          }
          right={<Link className="text-sm text-muted hover:text-ink" to="/planned">{t('dashboard.manage')}</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">{t('dashboard.due')}</th>
                  <th className="px-5 py-2 font-medium">{t('common.description')}</th>
                  <th className="px-5 py-2 font-medium">{t('common.source')}</th>
                  <th className="px-5 py-2 font-medium">{t('common.category')}</th>
                  <th className="px-5 py-2 font-medium text-right">{t('common.amount')}</th>
                  {isAdmin && <th className="px-5 py-2" />}
                </tr>
              </thead>
              <tbody>
                {upcoming.map((o, i) => {
                  const overdue = o.due_date < today;
                  const daysOut = daysBetween(today, o.due_date);
                  return (
                    <tr key={`${o.planned_id}-${o.due_date}-${i}`} className="border-t border-line">
                      <td className="px-5 py-2">
                        <div className={overdue ? 'text-expense font-medium' : ''}>
                          {formatDate(o.due_date)}
                        </div>
                        <div className="text-xs text-muted">
                          {overdue
                            ? t('dashboard.daysOverdue', { count: -daysOut })
                            : daysOut === 0 ? t('dashboard.today')
                            : t('dashboard.inDays', { count: daysOut })}
                        </div>
                      </td>
                      <td className="px-5 py-2">{o.description}</td>
                      <td className="px-5 py-2">
                        <span className="chip bg-canvas border border-line">{o.funding_source}</span>
                      </td>
                      <td className="px-5 py-2 text-muted">
                        {o.category}{o.subcategory ? ` · ${o.subcategory}` : ''}
                      </td>
                      <td className={`px-5 py-2 text-right tabular-nums ${o.amount >= 0 ? 'text-income' : 'text-expense'}`}>
                        {formatSigned(o.amount)}
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-2 text-right">
                          {overdue && (
                            <button
                              className="btn-secondary text-xs"
                              onClick={() => setMarkPaidOccurrence(o)}
                            >
                              {t('planned.markPaid')}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Collapsible>
      )}

      {projectionWithRunning.some((m) => m.occurrences.length > 0) && (
        <Collapsible
          title={t('dashboard.cashFlowProjection')}
          right={<Link className="text-sm text-muted hover:text-ink" to="/planned">{t('dashboard.editRules')}</Link>}
          defaultOpen={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">{t('dashboard.month')}</th>
                  <th className="px-5 py-2 font-medium text-right">{t('dashboard.net')}</th>
                  <th className="px-5 py-2 font-medium text-right">Cash</th>
                  <th className="px-5 py-2 font-medium text-right">DH</th>
                  <th className="px-5 py-2 font-medium text-right">Revolut</th>
                  <th className="px-5 py-2 font-medium text-right">{t('dashboard.projectedTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {projectionWithRunning.map((m) => (
                  <tr key={m.monthKey} className="border-t border-line">
                    <td className="px-5 py-2">{monthLabel(m.monthKey)}</td>
                    <td className={`px-5 py-2 text-right tabular-nums ${m.net >= 0 ? 'text-income' : 'text-expense'}`}>
                      {m.net !== 0 ? formatSigned(m.net) : '—'}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums ${m.runCash < 0 ? 'text-expense' : ''}`}>
                      {formatEur(m.runCash)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums ${m.runDh < 0 ? 'text-expense' : ''}`}>
                      {formatEur(m.runDh)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums ${m.runRevolut < 0 ? 'text-expense' : ''}`}>
                      {formatEur(m.runRevolut)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums font-medium ${m.runTotal < 0 ? 'text-expense' : ''}`}>
                      {formatEur(m.runTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 text-xs text-muted border-t border-line">
            {t('dashboard.projectionNote', { balance: formatEur(balanceBySource.total) })}
          </div>
        </Collapsible>
      )}

      <MarkPaidModal
        occurrence={markPaidOccurrence}
        trips={trips}
        categories={categories}
        subcategories={subcategories}
        planned={planned}
        plannedPayments={plannedPayments}
        onDone={() => { setMarkPaidOccurrence(null); reload(); }}
        onClose={() => setMarkPaidOccurrence(null)}
      />

      <Collapsible
        title={t('dashboard.cashBalanceByTrip')}
        right={<Link className="text-sm text-muted hover:text-ink" to="/trips">{t('dashboard.manageTrips')}</Link>}
        defaultOpen={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr>
                <th className="px-5 py-2 font-medium">{t('nav.trips')}</th>
                <th className="px-5 py-2 font-medium">{t('trips.dates')}</th>
                <th className="px-5 py-2 font-medium text-right">{t('dashboard.freshCash')}</th>
                <th className="px-5 py-2 font-medium text-right">{t('dashboard.cashSpent')}</th>
                <th className="px-5 py-2 font-medium text-right">{t('dashboard.lastBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-4 text-muted">{t('dashboard.noTrips')}</td></tr>
              )}
              {balances.map((b) => (
                <tr key={b.trip.id} className="border-t border-line">
                  <td className="px-5 py-2">{b.trip.name} <span className="text-muted">· {b.trip.city}</span></td>
                  <td className="px-5 py-2 text-muted">
                    {formatDate(b.trip.start_date)} – {formatDate(b.trip.end_date)}
                  </td>
                  <td className="px-5 py-2 text-right tabular-nums">{formatEur(b.freshCash)}</td>
                  <td className="px-5 py-2 text-right tabular-nums text-expense">−{formatEur(b.cashExpenses)}</td>
                  <td className="px-5 py-2 text-right tabular-nums font-medium">{formatEur(b.lastBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapsible>
    </div>
  );
}

function Collapsible({
  title, right, children, defaultOpen = true,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card">
      <header className={`px-5 py-3 flex items-center justify-between gap-3 ${open ? 'border-b border-line' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <span className={`text-muted text-xs inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          <span className="font-semibold">{title}</span>
        </button>
        {right}
      </header>
      {open && children}
    </section>
  );
}

