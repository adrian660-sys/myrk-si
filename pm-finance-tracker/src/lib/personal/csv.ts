import {
  personalCategoryName,
  personalFundingSourceName,
  personalSubcategoryName,
} from './lookups';
import type {
  PersonalCategory,
  PersonalFundingSource,
  PersonalSubcategory,
  PersonalTransaction,
} from './types';

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
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPersonalTransactionsCsv(
  rows: PersonalTransaction[],
  categories: PersonalCategory[],
  subcategories: PersonalSubcategory[],
  sources: PersonalFundingSource[],
  filenameHint?: string
) {
  const headers = [
    'date', 'description', 'amount', 'category', 'subcategory',
    'funding_source', 'notes', 'import_source',
  ];
  const data = rows.map((t) => [
    t.date,
    t.description,
    t.amount,
    personalCategoryName(t.category_id, categories),
    personalSubcategoryName(t.subcategory_id, subcategories),
    personalFundingSourceName(t.funding_source_id, sources),
    t.notes ?? '',
    t.import_source,
  ]);
  const suffix = new Date().toISOString().slice(0, 10);
  const name = `personal_transactions_${filenameHint ? filenameHint + '_' : ''}${suffix}.csv`;
  download(name, toCsv(headers, data));
}
