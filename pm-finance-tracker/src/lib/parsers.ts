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

export function parseCsv(
  text: string,
  trips: { id: string; name: string }[] = []
): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Tolerant header matching: lowercase, strip non-alphanumerics, then map
  // common aliases (e.g. "Funding Source", "Type", Slovenian variants) onto
  // our canonical column names. Without this a CSV typed by a human collapses
  // every row to "0 will import".
  const headerCells = splitCsvLine(lines[0]).map(canonicaliseHeader);
  const idx = (name: string) => headerCells.indexOf(name);

  const iDate = idx('date');
  const iDesc = idx('description');
  const iSource = idx('funding_source');
  const iCat = idx('category');
  const iSub = idx('subcategory');
  let iAmt = idx('amount');
  const iNotes = idx('notes');
  const iBill = idx('bill');
  const iTrip = idx('trip');

  // If no "amount" header was found, assume the rightmost column is the amount
  // and look for the first numeric value to lock it in. CSVs exported by some
  // tools leave the value column unlabelled.
  if (iAmt === -1 && lines.length > 1) {
    const sampleCols = splitCsvLine(lines[1]);
    for (let i = sampleCols.length - 1; i >= 0; i--) {
      if (parseAmount(sampleCols[i].trim()) !== 0) { iAmt = i; break; }
    }
  }

  const tripByName = new Map(trips.map((t) => [t.name.toLowerCase().trim(), t.id]));
  // Fallback map: normalise diacritics + collapse whitespace for fuzzy matching.
  const tripByNorm = new Map(trips.map((t) => [normaliseForMatch(t.name), t.id]));

  const out: ParsedTransaction[] = [];
  for (let row = 1; row < lines.length; row++) {
    const cols = splitCsvLine(lines[row]);
    const get = (i: number) => (i >= 0 && i < cols.length ? cols[i].trim() : '');

    const amount = parseAmount(get(iAmt));
    const source = (get(iSource) || 'Cash') as FundingSource;
    const category = (canoniseCategory(get(iCat)) || 'Business') as Category;
    const billRaw = get(iBill);
    const bill: BillStatus = billRaw === '📎 Bill' || billRaw === 'Bill' ? '📎 Bill'
      : billRaw === '/' ? '/' : '';

    const tripRaw = get(iTrip);
    const trip_id = tripRaw
      ? (tripByName.get(tripRaw.toLowerCase().trim())
          ?? tripByNorm.get(normaliseForMatch(tripRaw))
          ?? null)
      : null;

    // Travel rows must be linked to a trip — otherwise we can't tell which
    // trip's budget the expense came out of. Flag for review.
    const travelMissingTrip = category === 'Travel' && !trip_id;
    // Subcategory is mandatory for every category except Transfer.
    const sub = get(iSub) || null;
    const subRequiredMissing = category !== 'Transfer' && !sub;
    const needsReview = !get(iCat) || !get(iSource) || travelMissingTrip || subRequiredMissing;
    out.push({
      date: parseDate(get(iDate)),
      description: get(iDesc) || '(no description)',
      funding_source: source,
      category,
      subcategory: sub,
      amount,
      notes: get(iNotes) || null,
      bill_status: bill,
      trip_id,
      needsReview,
      duplicate: false,
      include: !needsReview,
    });
  }
  return out;
}

/**
 * Normalise a header cell into our canonical column name. "Funding Source",
 * "funding_source", "Source", "Račun" all resolve to "funding_source".
 */
function canonicaliseHeader(raw: string): string {
  const key = raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const aliases: Record<string, string> = {
    date: 'date', datum: 'date',
    description: 'description', desc: 'description', opis: 'description',
    funding_source: 'funding_source', source: 'funding_source', funding: 'funding_source',
    category: 'category', type: 'category', kategorija: 'category', tip: 'category',
    subcategory: 'subcategory', sub_category: 'subcategory', subcat: 'subcategory',
    podkategorija: 'subcategory', sub: 'subcategory',
    amount: 'amount', znesek: 'amount', value: 'amount',
    notes: 'notes', note: 'notes', opomba: 'notes', opombe: 'notes',
    bill: 'bill', racun: 'bill', invoice: 'bill',
    trip: 'trip', potovanje: 'trip',
  };
  return aliases[key] ?? key;
}

/** Map common category synonyms onto our 4 canonical names. */
function canoniseCategory(raw: string): string {
  const k = raw.toLowerCase().trim();
  if (!k) return '';
  if (k.startsWith('income')) return 'Income';
  if (k.startsWith('business')) return 'Business';
  if (k.startsWith('travel')) return 'Travel';
  if (k.startsWith('transfer')) return 'Transfer';
  if (k === 'other expenses' || k === 'other') return 'Travel';
  // Preserve already-canonical capitalisation if it matches exactly.
  return raw.trim();
}

/**
 * Parse any of: "2025-02-21", "21.2.2025", "21. 2. 2025", "21. 02.25",
 * "21/02/2025", "02/21/2025". Returns YYYY-MM-DD or null.
 */
function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // Already ISO
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD.MM.YYYY / DD/MM/YYYY (with optional spaces, 2 or 4 digit year)
  m = s.match(/^(\d{1,2})[.\s/-]+(\d{1,2})[.\s/-]+(\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = '20' + y;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/**
 * Parse a number string in either US ("1,234.56" / "298.68") or Slovenian
 * ("1.234,56") format. The rule: whichever of `.` or `,` appears last is
 * treated as the decimal separator; the other is a thousands separator and
 * stripped. Plain "298.68" -> 298.68; "29.868,00" -> 29868.
 *
 * Also normalises Unicode minus variants (U+2212, en-dash, em-dash) that
 * Google Sheets and some PDF exports emit instead of ASCII '-'.
 */
function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/[−–—]/g, '-')
    .replace(/[€\s]/g, '');
  if (!cleaned) return 0;
  const dot = cleaned.lastIndexOf('.');
  const com = cleaned.lastIndexOf(',');
  const normalised = com > dot
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const n = Number(normalised);
  return Number.isFinite(n) ? n : 0;
}

/** Strip diacritics, lowercase, collapse whitespace — used for fuzzy trip matching. */
function normaliseForMatch(s: string): string {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
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
