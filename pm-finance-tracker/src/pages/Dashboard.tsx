import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard';
import { useFinanceData } from '../hooks/useFinanceData';
import { computeTripBalances, cashWalletBalance } from '../lib/tripBalance';
import { formatEur, formatSigned, formatDate, monthLabel } from '../lib/format';
import {
  projectMonths, upcomingOccurrences, todayIsoLocal, daysBetween,
} from '../lib/planned';

export default function Dashboard() {
  const {
    trips, transactions, cashReceived, projectReceipts, planned, loading, error,
  } = useFinanceData();

  const balances = useMemo(
    () => computeTripBalances(trips, transactions, cashReceived),
    [trips, transactions, cashReceived]
  );

  const totals = useMemo(() => {
    const income = projectReceipts.reduce((s, r) => s + r.amount, 0);
    const freshCash = cashReceived.reduce((s, c) => s + c.amount, 0);
    let expenses = 0;
    for (const t of transactions) {
      if (t.category === 'Transfer') continue;
      if (t.amount < 0) expenses += Math.abs(t.amount);
    }
    return {
      income, freshCash, expenses,
      cash: cashWalletBalance(transactions, cashReceived),
    };
  }, [transactions, cashReceived, projectReceipts]);

  const balanceBySource = useMemo(() => {
    let cash = 0, dh = 0, revolut = 0;
    for (const c of cashReceived) {
      if (c.funding_source === 'Cash') cash += c.amount;
      else if (c.funding_source === 'DH') dh += c.amount;
      else if (c.funding_source === 'Revolut') revolut += c.amount;
    }
    for (const r of projectReceipts) {
      if (r.funding_source === 'Cash') cash += r.amount;
      else if (r.funding_source === 'DH') dh += r.amount;
      else if (r.funding_source === 'Revolut') revolut += r.amount;
    }
    for (const t of transactions) {
      if (t.funding_source === 'Cash') cash += t.amount;
      else if (t.funding_source === 'DH') dh += t.amount;
      else if (t.funding_source === 'Revolut') revolut += t.amount;
    }
    return { cash, dh, revolut, total: cash + dh + revolut };
  }, [cashReceived, projectReceipts, transactions]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const t of transactions) {
      if (t.category === 'Transfer') continue;
      if (t.amount >= 0) continue;
      const subMap = map.get(t.category) ?? new Map<string, number>();
      const subKey = t.subcategory ?? '—';
      subMap.set(subKey, (subMap.get(subKey) ?? 0) + Math.abs(t.amount));
      map.set(t.category, subMap);
    }
    return [...map.entries()]
      .map(([category, subs]) => ({
        category,
        total: [...subs.values()].reduce((s, v) => s + v, 0),
        subs: [...subs.entries()]
          .map(([sub, amount]) => ({ sub, amount }))
          .sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const drafts = useMemo(() => transactions.filter((t) => !t.date), [transactions]);
  const travelNoTrip = useMemo(
    () => transactions.filter((t) => t.category === 'Travel' && !t.trip_id),
    [transactions]
  );

  const upcoming = useMemo(
    () => upcomingOccurrences(planned, { ahead: 30, pastDays: 7 }),
    [planned]
  );
  const today = todayIsoLocal();
  const overdueCount = upcoming.filter((o) => o.due_date < today).length;

  const projection = useMemo(() => projectMonths(planned, 12), [planned]);
  const projectionWithRunning = useMemo(() => {
    let running = totals.cash;
    return projection.map((m) => {
      running += m.net;
      return { ...m, runningCash: running };
    });
  }, [projection, totals.cash]);

  if (loading) return <div className="p-6 text-muted">Loading…</div>;
  if (error) return <div className="p-6 text-expense">Error: {error}</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">All values in EUR.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Current balance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KpiCard label="Cash" value={balanceBySource.cash}
            tone={balanceBySource.cash >= 0 ? 'neutral' : 'expense'}
            hint="Cash received − cash spent" />
          <KpiCard label="DH" value={balanceBySource.dh}
            tone={balanceBySource.dh >= 0 ? 'neutral' : 'expense'}
            hint="Sum of DH transactions" />
          <KpiCard label="Revolut" value={balanceBySource.revolut}
            tone={balanceBySource.revolut >= 0 ? 'neutral' : 'expense'}
            hint="Sum of Revolut transactions" />
          <KpiCard label="Total" value={balanceBySource.total}
            tone={balanceBySource.total >= 0 ? 'income' : 'expense'}
            hint="Cash + DH + Revolut" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Total sum
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <KpiCard label="Income" value={totals.income} tone="neutral"
            hint="Total from project receipts" />
          <KpiCard label="Cash" value={totals.freshCash} tone="neutral"
            hint="Total fresh cash received on trips" />
        </div>
        <ExpensesCard total={totals.expenses} breakdown={expenseBreakdown} />
      </section>

      {drafts.length > 0 && (
        <div className="card-pad border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Needs attention</div>
              <div className="text-sm text-muted">
                {drafts.length} draft transaction{drafts.length === 1 ? '' : 's'} missing a date.
              </div>
            </div>
            <Link className="btn-secondary" to="/transactions?filter=drafts">Review</Link>
          </div>
        </div>
      )}

      {travelNoTrip.length > 0 && (
        <div className="card-pad border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Travel without a trip</div>
              <div className="text-sm text-muted">
                {travelNoTrip.length} Travel transaction{travelNoTrip.length === 1 ? '' : 's'} not linked to any trip.
              </div>
            </div>
            <Link className="btn-secondary" to="/transactions?warn=travel-no-trip">Review</Link>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <Collapsible
          title={
            <>
              Upcoming bills — next 30 days
              {overdueCount > 0 && (
                <span className="ml-2 chip bg-red-100 text-red-800">
                  {overdueCount} overdue
                </span>
              )}
            </>
          }
          right={<Link className="text-sm text-muted hover:text-ink" to="/planned">Manage →</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">Due</th>
                  <th className="px-5 py-2 font-medium">Description</th>
                  <th className="px-5 py-2 font-medium">Source</th>
                  <th className="px-5 py-2 font-medium">Category</th>
                  <th className="px-5 py-2 font-medium text-right">Amount</th>
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
                            ? `${-daysOut} day${daysOut === -1 ? '' : 's'} overdue`
                            : daysOut === 0 ? 'today'
                            : `in ${daysOut} day${daysOut === 1 ? '' : 's'}`}
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
          title="Cash-flow projection — next 12 months"
          right={<Link className="text-sm text-muted hover:text-ink" to="/planned">Edit rules →</Link>}
          defaultOpen={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">Month</th>
                  <th className="px-5 py-2 font-medium text-right">Expected in</th>
                  <th className="px-5 py-2 font-medium text-right">Expected out</th>
                  <th className="px-5 py-2 font-medium text-right">Net</th>
                  <th className="px-5 py-2 font-medium text-right">Projected cash</th>
                </tr>
              </thead>
              <tbody>
                {projectionWithRunning.map((m) => (
                  <tr key={m.monthKey} className="border-t border-line">
                    <td className="px-5 py-2">{monthLabel(m.monthKey)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-income">
                      {m.income > 0 ? formatEur(m.income) : '—'}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-expense">
                      {m.expense > 0 ? '−' + formatEur(m.expense) : '—'}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums ${m.net >= 0 ? 'text-income' : 'text-expense'}`}>
                      {formatSigned(m.net)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums font-medium ${m.runningCash >= 0 ? '' : 'text-expense'}`}>
                      {formatEur(m.runningCash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 text-xs text-muted border-t border-line">
            "Projected cash" applies expected income/expenses to today's current cash
            balance ({formatEur(totals.cash)}). Bank-account balances (DH / Revolut)
            aren't tracked separately — they show as net delta only.
          </div>
        </Collapsible>
      )}

      <Collapsible
        title="Cash balance by trip"
        right={<Link className="text-sm text-muted hover:text-ink" to="/trips">Manage trips →</Link>}
        defaultOpen={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr>
                <th className="px-5 py-2 font-medium">Trip</th>
                <th className="px-5 py-2 font-medium">Dates</th>
                <th className="px-5 py-2 font-medium text-right">Fresh cash</th>
                <th className="px-5 py-2 font-medium text-right">Cash spent</th>
                <th className="px-5 py-2 font-medium text-right">Last balance</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-4 text-muted">No trips yet.</td></tr>
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

function ExpensesCard({
  total, breakdown,
}: {
  total: number;
  breakdown: { category: string; total: number; subs: { sub: string; amount: number }[] }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-pad">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between text-left"
      >
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">Total expenses</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-ink">
            {formatEur(total)}
          </div>
          <div className="mt-1 text-xs text-muted">
            {open ? 'Click to hide breakdown' : 'Click for breakdown by category'}
          </div>
        </div>
        <span className={`text-muted text-xs inline-block transition-transform mt-1 ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <table className="w-full text-sm">
            <tbody>
              {breakdown.map((cat) => (
                <Fragment key={cat.category}>
                  <tr className="border-t border-line first:border-t-0">
                    <td className="px-2 py-2 font-medium">{cat.category}</td>
                    <td className="px-2 py-2 text-right tabular-nums font-medium">
                      {formatEur(cat.total)}
                    </td>
                  </tr>
                  {cat.subs.map((s) => (
                    <tr key={s.sub} className="text-muted">
                      <td className="px-2 py-1 pl-8 text-xs">{s.sub}</td>
                      <td className="px-2 py-1 text-right tabular-nums text-xs">{formatEur(s.amount)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && breakdown.length === 0 && (
        <div className="mt-4 pt-4 border-t border-line text-sm text-muted">
          No expenses yet.
        </div>
      )}
    </div>
  );
}
