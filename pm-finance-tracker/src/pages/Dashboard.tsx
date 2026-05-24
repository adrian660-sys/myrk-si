import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard';
import DonutChart from '../components/DonutChart';
import { useFinanceData } from '../hooks/useFinanceData';
import { computeTripBalances, cashWalletBalance } from '../lib/tripBalance';
import { formatEur, formatSigned, formatDate, monthKey, monthLabel } from '../lib/format';
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

  // Balance per funding source.
  // Cash    = Cash deposits (cash_received + project_receipts where source=Cash)
  //           + signed Cash transactions
  // DH      = DH deposits (same two sources)    + signed DH transactions
  // Revolut = Revolut deposits (same two sources) + signed Revolut transactions
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

  const monthly = useMemo(() => {
    const map = new Map<string, { income: number; travel: number; business: number; net: number }>();
    for (const r of projectReceipts) {
      const k = monthKey(r.date);
      const row = map.get(k) ?? { income: 0, travel: 0, business: 0, net: 0 };
      row.income += r.amount;
      map.set(k, row);
    }
    for (const c of cashReceived) {
      const k = monthKey(c.date);
      const row = map.get(k) ?? { income: 0, travel: 0, business: 0, net: 0 };
      row.income += c.amount;
      map.set(k, row);
    }
    for (const t of transactions) {
      if (!t.date || t.category === 'Transfer') continue;
      const k = monthKey(t.date);
      const row = map.get(k) ?? { income: 0, travel: 0, business: 0, net: 0 };
      if (t.category === 'Travel') row.travel += Math.abs(Math.min(t.amount, 0));
      if (t.category === 'Business') row.business += Math.abs(Math.min(t.amount, 0));
      map.set(k, row);
    }
    for (const [k, row] of map) {
      row.net = row.income - row.travel - row.business;
      map.set(k, row);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12);
  }, [transactions, cashReceived, projectReceipts]);

  const donut = useMemo(() => {
    let travel = 0, business = 0;
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      if (t.category === 'Travel') travel += Math.abs(t.amount);
      else if (t.category === 'Business') business += Math.abs(t.amount);
    }
    return [
      { label: 'Travel', value: travel, color: '#7c3aed' },
      { label: 'Business', value: business, color: '#ea580c' },
    ];
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <KpiCard label="Income" value={totals.income} tone="income"
            hint="Total from project receipts" />
          <KpiCard label="Cash" value={totals.freshCash} tone="income"
            hint="Total fresh cash received on trips" />
          <KpiCard label="Total Expenses" value={totals.expenses} tone="expense"
            hint="Sum of all expenses" />
        </div>
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
        <section className="card">
          <header className="px-5 py-3 border-b border-line flex items-center justify-between">
            <h2 className="font-semibold">
              Upcoming bills — next 30 days
              {overdueCount > 0 && (
                <span className="ml-2 chip bg-red-100 text-red-800">
                  {overdueCount} overdue
                </span>
              )}
            </h2>
            <Link className="text-sm text-muted hover:text-ink" to="/planned">Manage →</Link>
          </header>
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
        </section>
      )}

      {projectionWithRunning.some((m) => m.occurrences.length > 0) && (
        <section className="card">
          <header className="px-5 py-3 border-b border-line flex items-center justify-between">
            <h2 className="font-semibold">Cash-flow projection — next 12 months</h2>
            <Link className="text-sm text-muted hover:text-ink" to="/planned">Edit rules →</Link>
          </header>
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
        </section>
      )}

      <section className="card">
        <header className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h2 className="font-semibold">Cash balance by trip</h2>
          <Link className="text-sm text-muted hover:text-ink" to="/trips">Manage trips →</Link>
        </header>
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
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="card">
          <header className="px-5 py-3 border-b border-line">
            <h2 className="font-semibold">Monthly breakdown</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">Month</th>
                  <th className="px-5 py-2 font-medium text-right">Income</th>
                  <th className="px-5 py-2 font-medium text-right">Travel</th>
                  <th className="px-5 py-2 font-medium text-right">Business</th>
                  <th className="px-5 py-2 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-4 text-muted">No data yet.</td></tr>
                )}
                {monthly.map(([k, r]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="px-5 py-2">{monthLabel(k)}</td>
                    <td className="px-5 py-2 text-right tabular-nums text-income">{formatEur(r.income)}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{formatEur(r.travel)}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{formatEur(r.business)}</td>
                    <td className={`px-5 py-2 text-right tabular-nums font-medium ${r.net >= 0 ? 'text-income' : 'text-expense'}`}>
                      {formatSigned(r.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card-pad">
          <h2 className="font-semibold">Expense distribution</h2>
          <p className="text-xs text-muted mb-4">Travel vs Business — all time.</p>
          <DonutChart segments={donut} />
        </section>
      </div>
    </div>
  );
}
