import type { PlannedTransaction, PlannedOccurrence, PlannedPayment } from './types';

/**
 * Expand a planned/recurring rule into concrete dated occurrences that fall
 * inside [from, to] (inclusive). Only active rules contribute; rules with an
 * end_date stop at that date.
 *
 *   once       -> exactly one occurrence on start_date
 *   monthly    -> start_date, +1m, +2m, ...
 *   quarterly  -> start_date, +3m, +6m, ...
 *   yearly     -> start_date, +1y, +2y, ...
 */
export function expandOccurrences(
  rule: PlannedTransaction,
  from: string,
  to: string
): PlannedOccurrence[] {
  if (!rule.active) return [];
  if (rule.frequency === 'once') {
    return rule.start_date >= from && rule.start_date <= to
      ? [occurrenceFor(rule, rule.start_date)]
      : [];
  }

  const out: PlannedOccurrence[] = [];
  const step =
    rule.frequency === 'monthly' ? 1 :
    rule.frequency === 'quarterly' ? 3 : 12;

  // Fast-forward to the first occurrence >= from.
  let i = 0;
  let date = rule.start_date;
  // Bound the loop just in case so we never spin forever on weird input.
  const MAX_OCCURRENCES = 600; // 50 years of monthly
  while (date < from && i < MAX_OCCURRENCES) {
    i++;
    date = addMonths(rule.start_date, i * step);
  }
  while (date <= to && i < MAX_OCCURRENCES) {
    if (rule.end_date && date > rule.end_date) break;
    out.push(occurrenceFor(rule, date));
    i++;
    date = addMonths(rule.start_date, i * step);
  }
  return out;
}

function occurrenceFor(rule: PlannedTransaction, date: string): PlannedOccurrence {
  return {
    planned_id: rule.id,
    description: rule.description,
    funding_source: rule.funding_source,
    category: rule.category,
    subcategory: rule.subcategory,
    amount: rule.amount,
    due_date: date,
  };
}

/**
 * Add `n` months to a YYYY-MM-DD date, clamping the day to the last day of the
 * target month so that "31 Jan + 1 month" lands on 28/29 Feb rather than rolling
 * over into March.
 */
export function addMonths(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const target = m + n;
  const year = y + Math.floor((target - 1) / 12);
  const month = ((target - 1) % 12 + 12) % 12 + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Add `n` days to a YYYY-MM-DD date. */
export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days between two YYYY-MM-DD dates: positive when `to` is after `from`. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00Z').getTime();
  const b = new Date(to + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

/** YYYY-MM-DD for today, in the user's local timezone. */
export function todayIsoLocal(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ---------------------------------------------------------------------------
// Payments helpers
// ---------------------------------------------------------------------------

export function isOccurrencePaid(
  payments: PlannedPayment[],
  plannedId: string,
  dueDate: string,
): boolean {
  return payments.some((p) => p.planned_id === plannedId && p.due_date === dueDate);
}

/**
 * Given a transaction being entered, find the first unpaid planned occurrence
 * that looks like a match: same category + funding source, amount within 15%,
 * and transaction date within ±10 days of the due date.
 */
export function findMatchingPlanned(
  tx: { amountAbs: number; category: string; fundingSource: string; date: string },
  rules: PlannedTransaction[],
  payments: PlannedPayment[],
): { planned_id: string; due_date: string; description: string } | null {
  if (!tx.date || tx.amountAbs <= 0) return null;
  const from = addDays(tx.date, -10);
  const to = addDays(tx.date, 10);
  for (const rule of rules) {
    if (!rule.active || rule.amount >= 0) continue;
    if (rule.category !== tx.category) continue;
    if (rule.funding_source !== tx.fundingSource) continue;
    const tolerance = Math.abs(rule.amount) * 0.15;
    if (Math.abs(tx.amountAbs - Math.abs(rule.amount)) > tolerance) continue;
    const occs = expandOccurrences(rule, from, to);
    for (const occ of occs) {
      if (!isOccurrencePaid(payments, rule.id, occ.due_date)) {
        return { planned_id: rule.id, due_date: occ.due_date, description: rule.description };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cash-flow projection: rolls planned occurrences up into monthly totals over
// the next `horizonMonths` months.
// ---------------------------------------------------------------------------

export interface ProjectionMonth {
  monthKey: string;       // 'YYYY-MM'
  income: number;         // sum of positive occurrence amounts
  expense: number;        // sum of |negative occurrence amounts|
  net: number;            // income - expense
  bySource: Record<string, number>;  // signed net per funding source
  occurrences: PlannedOccurrence[];
}

export function projectMonths(
  rules: PlannedTransaction[],
  horizonMonths: number
): ProjectionMonth[] {
  const today = todayIsoLocal();
  const start = today.slice(0, 7) + '-01';
  const end = addMonths(start, horizonMonths) + '';
  const all = rules.flatMap((r) => expandOccurrences(r, start, end));

  const map = new Map<string, ProjectionMonth>();
  for (let i = 0; i < horizonMonths; i++) {
    const k = addMonths(start, i).slice(0, 7);
    map.set(k, { monthKey: k, income: 0, expense: 0, net: 0, bySource: {}, occurrences: [] });
  }
  for (const occ of all) {
    const k = occ.due_date.slice(0, 7);
    const row = map.get(k);
    if (!row) continue;
    if (occ.amount > 0) row.income += occ.amount;
    else row.expense += Math.abs(occ.amount);
    row.net = row.income - row.expense;
    row.bySource[occ.funding_source] = (row.bySource[occ.funding_source] ?? 0) + occ.amount;
    row.occurrences.push(occ);
  }
  return [...map.values()];
}

/**
 * The next `count` upcoming occurrences across all rules, plus anything still
 * overdue from the past `pastDays` days that hasn't been hidden.
 */
export function upcomingOccurrences(
  rules: PlannedTransaction[],
  opts: { ahead: number; pastDays: number }
): PlannedOccurrence[] {
  const today = todayIsoLocal();
  const from = addDays(today, -opts.pastDays);
  const to = addDays(today, opts.ahead);
  return rules
    .flatMap((r) => expandOccurrences(r, from, to))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}
