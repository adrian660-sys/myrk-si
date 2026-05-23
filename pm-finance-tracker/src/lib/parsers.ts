import type { ParsedTransaction, FundingSource, Category, BillStatus } from './types';

// ---------------------------------------------------------------------------
// Auto-categorisation rules per funding source. These run on the parsed text
// of a single statement row. They live here so the same logic can be used
// in tests and (optionally) reused on the client for previews.
// ---------------------------------------------------------------------------

interface CategorisedRow {
  category: Category;
  subcategory: string | null;
  needsReview: boolean;
}

export function categoriseDh(description: string): CategorisedRow {
  const d = description.toLowerCase();

  if (d.includes('zz in do prispevki') && d.includes('zzzs')) {
    return { category: 'Business', subcategory: 'Health Contribution', needsReview: false };
  }
  if (d.includes('zz in do prispevki') && d.includes('zpiz')) {
    return { category: 'Business', subcategory: 'Social Contribution', needsReview: false };
  }
  if (d.includes('pdp – proračun') || /\bpdp\b/.test(d)) {
    return { category: 'Business', subcategory: 'Tax', needsReview: false };
  }
  if (d.includes('odlivna provizija')) {
    return { category: 'Business', subcategory: 'Banking', needsReview: false };
  }
  if (d.includes('računovodskih storitev') || d.includes('racunovodskih storitev')) {
    return { category: 'Business', subcategory: 'Accounting', needsReview: false };
  }
  if (d.includes('transfer of fund')) {
    return { category: 'Transfer', subcategory: null, needsReview: false };
  }
  return { category: 'Business', subcategory: null, needsReview: true };
}

export function categoriseRevolut(code: string, moneyIn: number): CategorisedRow {
  const c = code.toUpperCase();
  if (c === 'FEE') return { category: 'Business', subcategory: 'Banking', needsReview: false };
  if (c === 'MOA' && moneyIn > 0) {
    return { category: 'Income', subcategory: 'Research Payment', needsReview: false };
  }
  if (c === 'MOS') return { category: 'Transfer', subcategory: null, needsReview: false };
  if (c === 'ATM') return { category: 'Travel', subcategory: 'Miscellaneous', needsReview: true };
  return { category: 'Business', subcategory: null, needsReview: true };
}

// ---------------------------------------------------------------------------
// CSV parser. Tolerant of missing columns: anything not present is left blank
// and falls into the review screen.
// ---------------------------------------------------------------------------

export function parseCsv(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iDate = idx('date');
  const iDesc = idx('description');
  const iSource = idx('funding_source');
  const iCat = idx('category');
  const iSub = idx('subcategory');
  const iAmt = idx('amount');
  const iNotes = idx('notes');
  const iBill = idx('bill');

  const out: ParsedTransaction[] = [];
  for (let row = 1; row < lines.length; row++) {
    const cols = splitCsvLine(lines[row]);
    const get = (i: number) => (i >= 0 && i < cols.length ? cols[i].trim() : '');

    const amount = parseFloat(get(iAmt).replace(/\./g, '').replace(',', '.')) || 0;
    const source = (get(iSource) || 'Cash') as FundingSource;
    const category = (get(iCat) || 'Business') as Category;
    const billRaw = get(iBill);
    const bill: BillStatus = billRaw === '📎 Bill' || billRaw === 'Bill' ? '📎 Bill'
      : billRaw === '/' ? '/' : '';

    const needsReview = !get(iCat) || !get(iSource);
    out.push({
      date: get(iDate) || null,
      description: get(iDesc) || '(no description)',
      funding_source: source,
      category,
      subcategory: get(iSub) || null,
      amount,
      notes: get(iNotes) || null,
      bill_status: bill,
      trip_id: null,
      needsReview,
      duplicate: false,
      include: !needsReview,
    });
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
