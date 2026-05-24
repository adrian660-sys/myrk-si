import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import KpiCard from '../../components/KpiCard';
import PersonalMonthlyChart from '../../components/personal/PersonalMonthlyChart';
import { usePersonalFinanceData } from '../../hooks/usePersonalFinanceData';
import { formatEur } from '../../lib/format';
import { personalCategoryById } from '../../lib/personal/lookups';
import { personalMonthlyTotals } from '../../lib/personal/planned';

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
