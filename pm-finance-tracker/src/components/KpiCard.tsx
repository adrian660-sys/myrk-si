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
    <div className="card-pad">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${color}`}>
        {formatEur(value)}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
