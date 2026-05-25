import { supabase } from './supabase';
import type { Invoice, InvoiceLine, InvoiceType } from './types';

/** Compute one line's total: quantity * unit_price * (1 - discount%). */
export function lineTotal(quantity: number, unitPrice: number, discountPct = 0): number {
  const gross = quantity * unitPrice;
  const after = gross * (1 - discountPct / 100);
  return Math.round(after * 100) / 100;
}

/** Sum lines into subtotal, discount, total. */
export function computeTotals(
  lines: { quantity: number; unit_price: number; discount_pct?: number }[]
): { subtotal: number; discount_total: number; total: number } {
  let subtotal = 0;
  let discount_total = 0;
  for (const l of lines) {
    const gross = l.quantity * l.unit_price;
    const after = gross * (1 - (l.discount_pct ?? 0) / 100);
    subtotal += gross;
    discount_total += gross - after;
  }
  const total = subtotal - discount_total;
  return {
    subtotal: round2(subtotal),
    discount_total: round2(discount_total),
    total: round2(total),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Format the invoice number for display & storage. Numbers are sequential per
 * (type, year). Proforma gets a leading "P".
 *
 *   invoice  -> "2025-001"
 *   proforma -> "P2025-001"
 */
export function formatInvoiceNumber(type: InvoiceType, year: number, seq: number): string {
  const padded = String(seq).padStart(3, '0');
  const base = `${year}-${padded}`;
  return type === 'proforma' ? `P${base}` : base;
}

/** Slovenian reference: model 00, "SI00 YYYYNNN" (no dash). */
export function formatReferenceNumber(year: number, seq: number): string {
  return `SI00 ${year}${String(seq).padStart(3, '0')}`;
}

/** Look up the next sequence number for (type, year) — admin-only path. */
export async function nextInvoiceSequence(type: InvoiceType, year: number): Promise<number> {
  const { data, error } = await supabase
    .from('invoices')
    .select('sequence_in_year')
    .eq('type', type)
    .eq('sequence_year', year)
    .order('sequence_in_year', { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const last = data?.[0]?.sequence_in_year ?? 0;
  return last + 1;
}

/** Insert an invoice + its lines in one go. Returns the created invoice id. */
export async function createInvoice(
  header: Omit<
    Invoice,
    | 'id'
    | 'invoice_number'
    | 'sequence_year'
    | 'sequence_in_year'
    | 'reference_number'
    | 'created_at'
    | 'updated_at'
  >,
  lines: Omit<InvoiceLine, 'id' | 'invoice_id' | 'created_at' | 'total'>[],
): Promise<string> {
  const year = parseInt(header.issue_date.slice(0, 4), 10);
  const seq = await nextInvoiceSequence(header.type, year);
  const invoice_number = formatInvoiceNumber(header.type, year, seq);
  const reference_number = formatReferenceNumber(year, seq);

  const totals = computeTotals(
    lines.map((l) => ({
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_pct: l.discount_pct ?? 0,
    })),
  );

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...header,
      invoice_number,
      sequence_year: year,
      sequence_in_year: seq,
      reference_number,
      subtotal: totals.subtotal,
      discount_total: totals.discount_total,
      total: totals.total,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Insert invoice failed');

  const invoiceId = data.id as string;

  if (lines.length > 0) {
    const rows = lines.map((l, i) => ({
      invoice_id: invoiceId,
      position: l.position ?? i,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unit_price,
      discount_pct: l.discount_pct ?? 0,
      total: lineTotal(l.quantity, l.unit_price, l.discount_pct ?? 0),
    }));
    const { error: linesErr } = await supabase.from('invoice_lines').insert(rows);
    if (linesErr) throw new Error(linesErr.message);
  }

  return invoiceId;
}

/** Update header + replace lines atomically (best-effort, no transaction). */
export async function updateInvoice(
  id: string,
  header: Partial<Invoice>,
  lines: Omit<InvoiceLine, 'id' | 'invoice_id' | 'created_at' | 'total'>[],
): Promise<void> {
  const totals = computeTotals(
    lines.map((l) => ({
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_pct: l.discount_pct ?? 0,
    })),
  );

  const { error } = await supabase
    .from('invoices')
    .update({
      ...header,
      subtotal: totals.subtotal,
      discount_total: totals.discount_total,
      total: totals.total,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  await supabase.from('invoice_lines').delete().eq('invoice_id', id);

  if (lines.length > 0) {
    const rows = lines.map((l, i) => ({
      invoice_id: id,
      position: l.position ?? i,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unit_price,
      discount_pct: l.discount_pct ?? 0,
      total: lineTotal(l.quantity, l.unit_price, l.discount_pct ?? 0),
    }));
    const { error: linesErr } = await supabase.from('invoice_lines').insert(rows);
    if (linesErr) throw new Error(linesErr.message);
  }
}

/**
 * Suggest an unpaid invoice that matches an incoming income transaction.
 * Match: same total (±1%), date within ±14 days of either issue or due date,
 * status in ('sent', 'draft').
 */
export function findMatchingInvoice(
  amount: number,
  date: string,
  invoices: Invoice[],
): Invoice | null {
  const tolerance = Math.max(0.01, amount * 0.01);
  for (const inv of invoices) {
    if (inv.status === 'paid' || inv.status === 'cancelled') continue;
    if (Math.abs(inv.total - amount) > tolerance) continue;
    const daysOff = Math.min(
      daysBetween(date, inv.issue_date),
      daysBetween(date, inv.due_date),
    );
    if (Math.abs(daysOff) > 14) continue;
    return inv;
  }
  return null;
}

function daysBetween(a: string, b: string): number {
  const ta = new Date(a + 'T00:00:00Z').getTime();
  const tb = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((tb - ta) / 86400000);
}

/** Add `n` days to a YYYY-MM-DD date. */
export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
