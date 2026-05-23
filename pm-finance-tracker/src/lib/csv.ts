/**
 * CSV export helpers. Produce a single CSV string, then trigger a browser
 * download. Columns chosen to be importable back through the CSV import flow.
 */

import type { PlannedTransaction, Transaction, Trip } from './types';

/** Escape a single CSV cell — quote anything containing commas, quotes, or newlines. */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s === '') return '';
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (unknown[])[]): string {
  const lines = [headers.join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
  return lines.join('\r\n');
}

function download(filename: string, csv: string) {
  // BOM so Excel on macOS/Windows opens UTF-8 cleanly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function timestampSuffix(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ---------------------------------------------------------------------------

export function downloadTransactionsCsv(
  rows: Transaction[],
  trips: Trip[],
  filenameHint?: string
) {
  const tripMap = new Map(trips.map((t) => [t.id, t]));
  const headers = [
    'date', 'description', 'funding_source', 'category', 'subcategory',
    'amount', 'notes', 'bill', 'trip',
  ];
  const data = rows.map((t) => [
    t.date ?? '',
    t.description,
    t.funding_source,
    t.category,
    t.subcategory ?? '',
    t.amount,
    t.notes ?? '',
    t.bill_status,
    t.trip_id ? tripMap.get(t.trip_id)?.name ?? '' : '',
  ]);
  const name = `transactions_${filenameHint ? filenameHint + '_' : ''}${timestampSuffix()}.csv`;
  download(name, toCsv(headers, data));
}

export function downloadPlannedCsv(rows: PlannedTransaction[]) {
  const headers = [
    'description', 'funding_source', 'category', 'subcategory', 'amount',
    'frequency', 'start_date', 'end_date', 'active', 'notes',
  ];
  const data = rows.map((p) => [
    p.description,
    p.funding_source,
    p.category,
    p.subcategory ?? '',
    p.amount,
    p.frequency,
    p.start_date,
    p.end_date ?? '',
    p.active ? 'true' : 'false',
    p.notes ?? '',
  ]);
  download(`planned_${timestampSuffix()}.csv`, toCsv(headers, data));
}
