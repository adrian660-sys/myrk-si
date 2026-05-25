import { formatEur } from '../lib/format';

interface Props {
  label: string;
  value: number;
  tone?: 'income' | 'expense' | 'neutral';
  hint?: string;
}

export default function KpiCard({ label, value, tone = 'neutral', hint }: Props) {
  const color =
    tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-ink';
  return (
    <div className="card p-5 flex flex-col gap-1">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`font-display text-3xl tabular-nums tracking-tight leading-none mt-1 ${color}`}>
        {formatEur(value)}
      </div>
      {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
    </div>
  );
}
