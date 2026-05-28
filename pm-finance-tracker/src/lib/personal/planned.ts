import type { PersonalPlannedOccurrence, PersonalPlannedTransaction } from './types';

export function personalExpandOccurrences(
  rule: PersonalPlannedTransaction,
  from: string,
  to: string
): PersonalPlannedOccurrence[] {
  if (!rule.active) return [];
  if (rule.frequency === 'once') {
    return rule.start_date >= from && rule.start_date <= to
      ? [personalOccurrenceFor(rule, rule.start_date)]
      : [];
  }
  const out: PersonalPlannedOccurrence[] = [];
  const step =
    rule.frequency === 'monthly' ? 1 :
    rule.frequency === 'quarterly' ? 3 : 12;
  let i = 0;
  let date = rule.start_date;
  const MAX = 600;
  while (date < from && i < MAX) {
    i++;
    date = personalAddMonths(rule.start_date, i * step);
  }
  while (date <= to && i < MAX) {
    if (rule.end_date && date > rule.end_date) break;
    out.push(personalOccurrenceFor(rule, date));
    i++;
    date = personalAddMonths(rule.start_date, i * step);
  }
  return out;
}

function personalOccurrenceFor(
  rule: PersonalPlannedTransaction,
  date: string
): PersonalPlannedOccurrence {
  return {
    planned_id: rule.id,
    description: rule.description,
    amount: rule.amount,
    category_id: rule.category_id,
    subcategory_id: rule.subcategory_id,
    funding_source_id: rule.funding_source_id,
    due_date: date,
  };
}

export function personalAddMonths(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const target = m + n;
  const year = y + Math.floor((target - 1) / 12);
  const month = ((target - 1) % 12 + 12) % 12 + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function personalTodayIsoLocal(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function personalNextDueDate(
  rule: PersonalPlannedTransaction,
  today = personalTodayIsoLocal()
): string | null {
  if (!rule.active) return null;
  if (rule.frequency === 'once') {
    return rule.start_date >= today ? rule.start_date : null;
  }
  const horizon = personalAddMonths(today, 60);
  const occs = personalExpandOccurrences(rule, today, horizon);
  return occs[0]?.due_date ?? null;
}

export interface PersonalMonthlyTotals {
  monthKey: string;
  income: number;
  expense: number;
  net: number;
}

export function personalMonthlyTotals(
  transactions: { date: string; amount: number; category_id: string }[],
  categories: { id: string; type: string }[],
  months: number
): PersonalMonthlyTotals[] {
  const typeMap = new Map(categories.map((c) => [c.id, c.type]));
  const today = personalTodayIsoLocal();
  const startKey = today.slice(0, 7);
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const [y, m] = startKey.split('-').map(Number);
    const d = new Date(y, m - 1 - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const map = new Map<string, PersonalMonthlyTotals>(
    keys.map((k) => [k, { monthKey: k, income: 0, expense: 0, net: 0 }])
  );
  for (const t of transactions) {
    const k = t.date.slice(0, 7);
    const row = map.get(k);
    if (!row) continue;
    const type = typeMap.get(t.category_id);
    if (type === 'transfer') continue;
    if (t.amount > 0) row.income += t.amount;
    else row.expense += Math.abs(t.amount);
    row.net = row.income - row.expense;
  }
  return keys.map((k) => map.get(k)!);
}

function personalAddDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function personalDaysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00Z').getTime();
  const b = new Date(to + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

export function personalUpcomingOccurrences(
  rules: PersonalPlannedTransaction[],
  opts: { ahead: number; pastDays: number }
): PersonalPlannedOccurrence[] {
  const today = personalTodayIsoLocal();
  const from = personalAddDays(today, -opts.pastDays);
  const to = personalAddDays(today, opts.ahead);
  return rules
    .flatMap((r) => personalExpandOccurrences(r, from, to))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export interface PersonalProjectionMonth {
  monthKey: string;
  income: number;
  expense: number;
  net: number;
  bySource: Record<string, number>;
  occurrences: PersonalPlannedOccurrence[];
}

export function personalProjectMonths(
  rules: PersonalPlannedTransaction[],
  horizonMonths: number
): PersonalProjectionMonth[] {
  const today = personalTodayIsoLocal();
  const start = today.slice(0, 7) + '-01';
  const end = personalAddMonths(start, horizonMonths);
  const all = rules.flatMap((r) => personalExpandOccurrences(r, start, end));

  const map = new Map<string, PersonalProjectionMonth>();
  for (let i = 0; i < horizonMonths; i++) {
    const k = personalAddMonths(start, i).slice(0, 7);
    map.set(k, { monthKey: k, income: 0, expense: 0, net: 0, bySource: {}, occurrences: [] });
  }
  for (const occ of all) {
    const k = occ.due_date.slice(0, 7);
    const row = map.get(k);
    if (!row) continue;
    if (occ.amount > 0) row.income += occ.amount;
    else row.expense += Math.abs(occ.amount);
    row.net = row.income - row.expense;
    row.bySource[occ.funding_source_id] = (row.bySource[occ.funding_source_id] ?? 0) + occ.amount;
    row.occurrences.push(occ);
  }
  return [...map.values()];
}
