// Supabase Edge Function — parses an uploaded DH or Revolut PDF.
//
// Request:  POST { path: string, kind: 'DH_PDF' | 'Revolut_PDF' }
// Response: { rows: ParsedTransaction[] }
//
// The function uses the service role key (kept as an Edge secret) to download
// from the private `bank-statements` bucket, then runs the appropriate parser.
//
// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';
import { extractPdfLines, parseSloveneNumber, parseDate } from '../_shared/pdf.ts';

interface ParsedTransaction {
  date: string | null;
  description: string;
  funding_source: 'Cash' | 'DH' | 'Revolut';
  category: 'Income' | 'Business' | 'Travel' | 'Transfer';
  subcategory: string | null;
  amount: number;
  notes: string | null;
  bill_status: '📎 Bill' | '/' | '';
  trip_id: null;
  needsReview: boolean;
  duplicate: false;
  include: boolean;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { path, kind } = await req.json();
    if (!path || !kind) {
      return json({ error: 'path and kind are required' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: blob, error } = await supabase.storage
      .from('bank-statements').download(path);
    if (error || !blob) {
      return json({ error: `download failed: ${error?.message ?? 'no data'}` }, 500);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const lines = await extractPdfLines(bytes);

    const rows = kind === 'DH_PDF' ? parseDh(lines)
      : kind === 'Revolut_PDF' ? parseRevolut(lines)
      : [];

    return json({ rows });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// DH (Delavska Hranilnica)
// Columns: Dat. knjž. | Ref. št. | Namen/Prejemnik | Sklic | V breme | V dobro
// Two numeric columns on the right; one is filled and one is empty per row.
// ---------------------------------------------------------------------------

function parseDh(lines: string[]): ParsedTransaction[] {
  const out: ParsedTransaction[] = [];
  // Heuristic: a row starts with a DD.MM.YYYY booking date.
  for (const line of lines) {
    const m = line.match(/^(\d{2}\.\d{2}\.\d{4})\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    const date = parseDate(m[1]);
    const rest = m[3];

    // Last two numbers on the line are V breme and V dobro (one is blank).
    const nums = [...rest.matchAll(/-?\d{1,3}(?:\.\d{3})*(?:,\d{2})/g)];
    if (nums.length === 0) continue;

    let debit: number | null = null;
    let credit: number | null = null;
    if (nums.length >= 2) {
      debit = parseSloveneNumber(nums[nums.length - 2][0]);
      credit = parseSloveneNumber(nums[nums.length - 1][0]);
    } else {
      // Only one number — assume it is whichever column is non-zero.
      const n = parseSloveneNumber(nums[0][0]);
      if (n && n < 0) debit = -n; else credit = n;
    }

    const description = rest.slice(0, nums[0].index ?? rest.length).trim();
    const amount = credit && credit > 0 ? credit : -(debit ?? 0);
    if (amount === 0) continue; // skip empty rows

    const cat = categoriseDh(description);
    out.push({
      date,
      description,
      funding_source: 'DH',
      category: cat.category,
      subcategory: cat.subcategory,
      amount,
      notes: null,
      bill_status: '/',
      trip_id: null,
      needsReview: cat.needsReview,
      duplicate: false,
      include: !cat.needsReview,
    });
  }
  return out;
}

function categoriseDh(description: string): { category: ParsedTransaction['category']; subcategory: string | null; needsReview: boolean } {
  const d = description.toLowerCase();
  if (d.includes('zz in do prispevki') && d.includes('zzzs'))
    return { category: 'Business', subcategory: 'Health Contribution', needsReview: false };
  if (d.includes('zz in do prispevki') && d.includes('zpiz'))
    return { category: 'Business', subcategory: 'Social Contribution', needsReview: false };
  if (d.includes('pdp – proračun') || /\bpdp\b/.test(d))
    return { category: 'Business', subcategory: 'Tax', needsReview: false };
  if (d.includes('odlivna provizija'))
    return { category: 'Business', subcategory: 'Banking', needsReview: false };
  if (d.includes('računovodskih storitev') || d.includes('racunovodskih storitev'))
    return { category: 'Business', subcategory: 'Accounting', needsReview: false };
  if (d.includes('transfer of fund'))
    return { category: 'Transfer', subcategory: null, needsReview: false };
  return { category: 'Business', subcategory: null, needsReview: true };
}

// ---------------------------------------------------------------------------
// Revolut Business
// Columns: Date (UTC) | Code | Description | Money out | Money in | Balance
// ---------------------------------------------------------------------------

function parseRevolut(lines: string[]): ParsedTransaction[] {
  const out: ParsedTransaction[] = [];
  // Codes seen on Revolut Business statements.
  const CODES = ['FEE', 'MOA', 'MOS', 'ATM', 'TRF', 'CRD', 'EXC', 'TOPUP'];
  const codeRegex = new RegExp(`\\b(${CODES.join('|')})\\b`);

  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/);
    if (!dateMatch) continue;
    const date = parseDate(dateMatch[1]);

    const codeMatch = line.match(codeRegex);
    if (!codeMatch) continue;
    const code = codeMatch[1];

    const nums = [...line.matchAll(/-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g)];
    if (nums.length < 2) continue;

    // Trailing balance, preceded by money-in and money-out (one is empty / 0).
    const balance = parseSloveneNumber(nums[nums.length - 1][0]) ?? 0;
    const moneyIn = nums.length >= 2 ? parseSloveneNumber(nums[nums.length - 2][0]) ?? 0 : 0;
    const moneyOut = nums.length >= 3 ? parseSloveneNumber(nums[nums.length - 3][0]) ?? 0 : 0;
    void balance;

    const amount = moneyIn > 0 ? moneyIn : -Math.abs(moneyOut);
    if (amount === 0) continue;

    // Description is between the code token and the first numeric column.
    const codeIdx = line.indexOf(code) + code.length;
    const firstNumIdx = nums[0].index ?? line.length;
    const description = line.slice(codeIdx, firstNumIdx).trim() || `Revolut ${code}`;

    const cat = categoriseRevolut(code, moneyIn);
    out.push({
      date,
      description,
      funding_source: 'Revolut',
      category: cat.category,
      subcategory: cat.subcategory,
      amount,
      notes: `Code: ${code}`,
      bill_status: '/',
      trip_id: null,
      needsReview: cat.needsReview,
      duplicate: false,
      include: !cat.needsReview,
    });
  }
  return out;
}

function categoriseRevolut(code: string, moneyIn: number) {
  const c = code.toUpperCase();
  if (c === 'FEE') return { category: 'Business' as const, subcategory: 'Banking', needsReview: false };
  if (c === 'MOA' && moneyIn > 0)
    return { category: 'Income' as const, subcategory: 'Research Payment', needsReview: false };
  if (c === 'MOS') return { category: 'Transfer' as const, subcategory: null, needsReview: false };
  if (c === 'ATM') return { category: 'Travel' as const, subcategory: 'Miscellaneous', needsReview: true };
  return { category: 'Business' as const, subcategory: null, needsReview: true };
}
