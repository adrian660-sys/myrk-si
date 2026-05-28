import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import KpiCard from '../../components/KpiCard';
import PersonalMonthlyChart from '../../components/personal/PersonalMonthlyChart';
import { usePersonalFinanceData } from '../../hooks/usePersonalFinanceData';
import { formatDate, formatEur, formatSigned, monthLabel } from '../../lib/format';
import { personalCategoryById } from '../../lib/personal/lookups';
import {
  personalMonthlyTotals,
  personalUpcomingOccurrences,
  personalProjectMonths,
  personalTodayIsoLocal,
  personalDaysBetween,
} from '../../lib/personal/planned';

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function PersonalDashboard() {
  const { t } = useTranslation();
  const {
    categories,
    subcategories,
    fundingSources,
    transactions,
    planned,
    loading,
    error,
  } = usePersonalFinanceData();

  const monthKey = currentMonthKey();

  const balanceBySource = useMemo(() => {
    return fundingSources.map((s) => ({
      id: s.id,
      name: s.name,
      balance: transactions
        .filter((t) => t.funding_source_id === s.id)
        .reduce((sum, t) => sum + t.amount, 0),
    }));
  }, [fundingSources, transactions]);

  const totals = useMemo(() => {
    let incomeAll = 0;
    let expenseAll = 0;
    let incomeMonth = 0;
    let expenseMonth = 0;
    for (const tx of transactions) {
      const cat = personalCategoryById(tx.category_id, categories);
      if (cat?.type === 'transfer') continue;
      if (tx.amount > 0) {
        incomeAll += tx.amount;
        if (tx.date.slice(0, 7) === monthKey) incomeMonth += tx.amount;
      } else {
        const abs = Math.abs(tx.amount);
        expenseAll += abs;
        if (tx.date.slice(0, 7) === monthKey) expenseMonth += abs;
      }
    }
    return { incomeAll, expenseAll, incomeMonth, expenseMonth };
  }, [transactions, categories, monthKey]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const tx of transactions) {
      const cat = personalCategoryById(tx.category_id, categories);
      if (!cat || cat.type !== 'expense' || tx.amount >= 0) continue;
      const subMap = map.get(cat.name) ?? new Map<string, number>();
      const subKey = subcategories.find((s) => s.id === tx.subcategory_id)?.name ?? '—';
      subMap.set(subKey, (subMap.get(subKey) ?? 0) + Math.abs(tx.amount));
      map.set(cat.name, subMap);
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
  }, [transactions, categories, subcategories]);

  const chartData = useMemo(
    () => personalMonthlyTotals(transactions, categories, 6),
    [transactions, categories]
  );

  const today = personalTodayIsoLocal();
  const upcoming = useMemo(
    () => personalUpcomingOccurrences(planned, { ahead: 30, pastDays: 14 }),
    [planned]
  );
  const overdueCount = upcoming.filter((o) => o.due_date < today).length;

  const projection = useMemo(() => personalProjectMonths(planned, 12), [planned]);
  const projectionWithRunning = useMemo(() => {
    const running: Record<string, number> = {};
    for (const s of balanceBySource) running[s.id] = s.balance;
    return projection.map((m) => {
      for (const fs of fundingSources) {
        running[fs.id] = (running[fs.id] ?? 0) + (m.bySource[fs.id] ?? 0);
      }
      const snapshot: Record<string, number> = {};
      for (const fs of fundingSources) snapshot[fs.id] = running[fs.id] ?? 0;
      const total = Object.values(snapshot).reduce((a, b) => a + b, 0);
      return { ...m, running: snapshot, total };
    });
  }, [projection, balanceBySource, fundingSources]);
  const startingTotal = balanceBySource.reduce((s, b) => s + b.balance, 0);

  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  if (loading) return <div className="p-6 text-muted">{t('common.loading')}</div>;
  if (error) return <div className="p-6 text-expense">Error: {error}</div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold">{t('personal.dashboardTitle')}</h1>
        <p className="text-sm text-muted">{t('personal.dashboardSubtitle')}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t('personal.balanceBySource')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {balanceBySource.map((s) => (
            <KpiCard key={s.id} label={s.name} value={s.balance}
              tone={s.balance >= 0 ? 'neutral' : 'expense'} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t('personal.incomeVsExpenses')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label={t('personal.incomeAll')} value={totals.incomeAll} tone="income" />
          <KpiCard label={t('personal.expenseAll')} value={totals.expenseAll} tone="expense" />
          <KpiCard label={t('personal.incomeMonth')} value={totals.incomeMonth} tone="income" />
          <KpiCard label={t('personal.expenseMonth')} value={totals.expenseMonth} tone="expense" />
        </div>
      </section>

      {upcoming.length > 0 && (
        <Collapsible
          title={
            <>
              {t('personal.upcomingBills')}
              {overdueCount > 0 && (
                <span className="ml-2 chip bg-red-100 text-red-800">
                  {overdueCount} {t('personal.overdue')}
                </span>
              )}
            </>
          }
          right={<Link className="text-sm text-muted hover:text-ink" to="/personal/planned">{t('personal.manage')}</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">{t('personal.due')}</th>
                  <th className="px-5 py-2 font-medium">{t('common.description')}</th>
                  <th className="px-5 py-2 font-medium">{t('common.source')}</th>
                  <th className="px-5 py-2 font-medium">{t('common.category')}</th>
                  <th className="px-5 py-2 font-medium text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((o, i) => {
                  const overdue = o.due_date < today;
                  const daysOut = personalDaysBetween(today, o.due_date);
                  const cat = categories.find((c) => c.id === o.category_id);
                  const fs = fundingSources.find((s) => s.id === o.funding_source_id);
                  return (
                    <tr key={`${o.planned_id}-${o.due_date}-${i}`} className="border-t border-line">
                      <td className="px-5 py-2">
                        <div className={overdue ? 'text-expense font-medium' : ''}>{formatDate(o.due_date)}</div>
                        <div className="text-xs text-muted">
                          {overdue
                            ? t('personal.daysOverdue', { count: -daysOut })
                            : daysOut === 0 ? t('personal.today')
                            : t('personal.inDays', { count: daysOut })}
                        </div>
                      </td>
                      <td className="px-5 py-2">{o.description}</td>
                      <td className="px-5 py-2">
                        <span className="chip bg-canvas border border-line">{fs?.name ?? '—'}</span>
                      </td>
                      <td className="px-5 py-2 text-muted">{cat?.name ?? '—'}</td>
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
          title={t('personal.cashFlowProjection')}
          right={<Link className="text-sm text-muted hover:text-ink" to="/personal/planned">{t('personal.editRules')}</Link>}
          defaultOpen={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="px-5 py-2 font-medium">{t('personal.month')}</th>
                  <th className="px-5 py-2 font-medium text-right">{t('personal.net')}</th>
                  {fundingSources.map((s) => (
                    <th key={s.id} className="px-5 py-2 font-medium text-right">{s.name}</th>
                  ))}
                  <th className="px-5 py-2 font-medium text-right">{t('personal.projectedTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {projectionWithRunning.map((m) => (
                  <tr key={m.monthKey} className="border-t border-line">
                    <td className="px-5 py-2">{monthLabel(m.monthKey)}</td>
                    <td className={`px-5 py-2 text-right tabular-nums ${m.net >= 0 ? 'text-income' : 'text-expense'}`}>
                      {m.net !== 0 ? formatSigned(m.net) : '—'}
                    </td>
                    {fundingSources.map((s) => (
                      <td key={s.id} className={`px-5 py-2 text-right tabular-nums ${(m.running[s.id] ?? 0) < 0 ? 'text-expense' : ''}`}>
                        {formatEur(m.running[s.id] ?? 0)}
                      </td>
                    ))}
                    <td className={`px-5 py-2 text-right tabular-nums font-medium ${m.total < 0 ? 'text-expense' : ''}`}>
                      {formatEur(m.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2 text-xs text-muted border-t border-line">
            {t('personal.projectionNote', { balance: formatEur(startingTotal) })}
          </div>
        </Collapsible>
      )}

      <PersonalMonthlyChart data={chartData} />

      <section className="card-pad">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-4">
          {t('personal.expenseBreakdown')}
        </h2>
        {expenseBreakdown.length === 0 ? (
          <p className="text-sm text-muted">{t('personal.noExpenses')}</p>
        ) : (
          <ul className="space-y-2">
            {expenseBreakdown.map((row) => {
              const open = openCats.has(row.category);
              return (
                <li key={row.category} className="border-b border-line last:border-0 pb-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left py-1"
                    onClick={() => {
                      setOpenCats((prev) => {
                        const next = new Set(prev);
                        if (next.has(row.category)) next.delete(row.category);
                        else next.add(row.category);
                        return next;
                      });
                    }}
                  >
                    <span className="font-medium">{row.category}</span>
                    <span className="tabular-nums text-expense">{formatEur(row.total)}</span>
                  </button>
                  {open && (
                    <ul className="pl-3 mt-1 space-y-1 text-sm text-muted">
                      {row.subs.map((s) => (
                        <li key={s.sub} className="flex justify-between">
                          <span>{s.sub}</span>
                          <span className="tabular-nums">{formatEur(s.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
