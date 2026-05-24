import { useTranslation } from 'react-i18next';
import { monthLabel } from '../../lib/format';
import type { PersonalMonthlyTotals } from '../../lib/personal/planned';

interface Props {
  data: PersonalMonthlyTotals[];
}

export default function PersonalMonthlyChart({ data }: Props) {
  const { t } = useTranslation();
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const w = 48;
  const gap = 12;
  const chartH = 120;
  const totalW = data.length * (w * 2 + gap) + gap;

  return (
    <div className="card-pad overflow-x-auto">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted mb-4">
        {t('personal.monthlyChart')}
      </h3>
      <svg viewBox={`0 0 ${totalW} ${chartH + 40}`} className="min-w-full" style={{ minWidth: totalW }}>
        {data.map((d, i) => {
          const x = gap + i * (w * 2 + gap);
          const incH = (d.income / maxVal) * chartH;
          const expH = (d.expense / maxVal) * chartH;
          return (
            <g key={d.monthKey}>
              <rect x={x} y={chartH - incH} width={w} height={incH} rx={3} className="fill-income/80" />
              <rect x={x + w + 4} y={chartH - expH} width={w} height={expH} rx={3} className="fill-expense/80" />
              <text x={x + w} y={chartH + 16} textAnchor="middle" className="fill-muted text-[10px]">
                {monthLabel(d.monthKey).slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-3 text-xs text-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-income/80" /> {t('personal.income')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-expense/80" /> {t('personal.expenses')}</span>
      </div>
    </div>
  );
}
