import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type {
  BankAccount, BusinessSettings, Client, Invoice, InvoiceLine, InvoiceType,
} from '../lib/types';
import { computeTotals, createInvoice, updateInvoice, lineTotal } from '../lib/invoicing';
import { formatEur, todayIso } from '../lib/format';
import { addDays } from '../lib/invoicing';

interface LineInput {
  position: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  discount_pct: string;
}

interface Props {
  initial: Invoice | null;
  initialType: InvoiceType;
  business: BusinessSettings | null;
  bankAccounts: BankAccount[];
  clients: Client[];
  existingLines: InvoiceLine[];
  onSaved: (id: string) => void;
  onCancel: () => void;
}

export default function InvoiceForm({
  initial, initialType, business, bankAccounts, clients, existingLines, onSaved, onCancel,
}: Props) {
  const { t } = useTranslation();
  const editing = !!initial;

  const defaultDueDays = business?.default_due_days ?? 14;
  const defaultBankId = business?.default_bank_account_id ?? bankAccounts[0]?.id ?? '';

  const [type] = useState<InvoiceType>(initial?.type ?? initialType);
  const [clientId, setClientId] = useState(initial?.client_id ?? '');
  const [bankId, setBankId] = useState(initial?.bank_account_id ?? defaultBankId);
  const [issueDate, setIssueDate] = useState(initial?.issue_date ?? todayIso());
  const [serviceDate, setServiceDate] = useState(initial?.service_date ?? todayIso());
  const [dueDate, setDueDate] = useState(
    initial?.due_date ?? addDays(todayIso(), defaultDueDays)
  );
  const [placeOfIssue, setPlaceOfIssue] = useState(
    initial?.place_of_issue ?? business?.place_of_issue ?? 'Ljubljana'
  );
  const [vatNotice, setVatNotice] = useState(
    initial?.vat_notice ?? business?.vat_notice ?? ''
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [lines, setLines] = useState<LineInput[]>(() => {
    if (existingLines.length > 0) {
      return existingLines
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((l, i) => ({
          position: l.position ?? i,
          description: l.description,
          quantity: String(l.quantity),
          unit: l.unit ?? 'kos',
          unit_price: String(l.unit_price),
          discount_pct: String(l.discount_pct ?? 0),
        }));
    }
    return [emptyLine(0)];
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const numericLines = useMemo(
    () =>
      lines.map((l) => ({
        quantity: parseFloat(l.quantity) || 0,
        unit_price: parseFloat(l.unit_price) || 0,
        discount_pct: parseFloat(l.discount_pct) || 0,
      })),
    [lines]
  );
  const totals = useMemo(() => computeTotals(numericLines), [numericLines]);

  function updateLine(i: number, patch: Partial<LineInput>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, emptyLine(ls.length)]);
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!clientId) { setErr(t('invoiceForm.clientRequired')); return; }
    if (!bankId) { setErr(t('invoiceForm.bankRequired')); return; }
    if (!issueDate || !serviceDate || !dueDate) {
      setErr(t('invoiceForm.datesRequired')); return;
    }
    const cleanLines = lines
      .map((l, i) => ({
        position: i,
        description: l.description.trim(),
        quantity: parseFloat(l.quantity) || 0,
        unit: l.unit.trim() || 'kos',
        unit_price: parseFloat(l.unit_price) || 0,
        discount_pct: parseFloat(l.discount_pct) || 0,
      }))
      .filter((l) => l.description && l.quantity > 0);
    if (cleanLines.length === 0) {
      setErr(t('invoiceForm.linesRequired')); return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateInvoice(
          initial!.id,
          {
            client_id: clientId,
            bank_account_id: bankId,
            issue_date: issueDate,
            service_date: serviceDate,
            due_date: dueDate,
            place_of_issue: placeOfIssue,
            vat_notice: vatNotice || null,
            notes: notes || null,
          },
          cleanLines
        );
        onSaved(initial!.id);
      } else {
        const newId = await createInvoice(
          {
            type,
            client_id: clientId,
            bank_account_id: bankId,
            issue_date: issueDate,
            service_date: serviceDate,
            due_date: dueDate,
            status: 'draft',
            subtotal: 0,
            discount_total: 0,
            total: 0,
            place_of_issue: placeOfIssue,
            vat_notice: vatNotice || null,
            notes: notes || null,
            paid_on: null,
            transaction_id: null,
            project_receipt_id: null,
            sent_at: null,
          },
          cleanLines
        );
        onSaved(newId);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {clients.length === 0 && (
        <div className="card-pad border-l-4 border-amber-400 text-sm">
          {t('invoiceForm.noClientsHint')}{' '}
          <Link to="/clients" className="underline">{t('invoiceForm.goToClients')}</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">{t('invoiceForm.client')}</label>
          <select className="input" value={clientId}
            onChange={(e) => setClientId(e.target.value)}>
            <option value="">— {t('invoiceForm.selectClient')} —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.city ? ` · ${c.city}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('invoiceForm.bankAccount')}</label>
          <select className="input" value={bankId}
            onChange={(e) => setBankId(e.target.value)}>
            <option value="">— {t('invoiceForm.selectBank')} —</option>
            {bankAccounts.filter((b) => b.is_active).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.iban}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">{t('invoiceForm.issueDate')}</label>
          <input type="date" className="input" value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('invoiceForm.serviceDate')}</label>
          <input type="date" className="input" value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('invoiceForm.dueDate')}</label>
          <input type="date" className="input" value={dueDate}
            onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">{t('invoiceForm.placeOfIssue')}</label>
        <input className="input" value={placeOfIssue}
          onChange={(e) => setPlaceOfIssue(e.target.value)} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">{t('invoiceForm.lines')}</h3>
          <button type="button" className="btn-secondary text-xs" onClick={addLine}>
            + {t('invoiceForm.addLine')}
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr>
                <th className="px-3 py-2 font-medium">{t('common.description')}</th>
                <th className="px-3 py-2 font-medium text-right">{t('invoiceForm.qty')}</th>
                <th className="px-3 py-2 font-medium">{t('invoiceForm.unit')}</th>
                <th className="px-3 py-2 font-medium text-right">{t('invoiceForm.unitPrice')}</th>
                <th className="px-3 py-2 font-medium text-right">{t('invoiceForm.discountPct')}</th>
                <th className="px-3 py-2 font-medium text-right">{t('invoiceForm.lineTotal')}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const q = parseFloat(l.quantity) || 0;
                const p = parseFloat(l.unit_price) || 0;
                const d = parseFloat(l.discount_pct) || 0;
                return (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1">
                      <input className="input" value={l.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        placeholder={t('invoiceForm.descriptionPlaceholder')} />
                    </td>
                    <td className="px-2 py-1 w-20">
                      <input className="input text-right" type="number" step="0.01" min="0"
                        value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} />
                    </td>
                    <td className="px-2 py-1 w-24">
                      <input className="input" value={l.unit}
                        onChange={(e) => updateLine(i, { unit: e.target.value })} />
                    </td>
                    <td className="px-2 py-1 w-28">
                      <input className="input text-right" type="number" step="0.01" min="0"
                        value={l.unit_price} onChange={(e) => updateLine(i, { unit_price: e.target.value })} />
                    </td>
                    <td className="px-2 py-1 w-20">
                      <input className="input text-right" type="number" step="0.01" min="0" max="100"
                        value={l.discount_pct} onChange={(e) => updateLine(i, { discount_pct: e.target.value })} />
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {formatEur(lineTotal(q, p, d))}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {lines.length > 1 && (
                        <button type="button" className="text-xs text-muted hover:text-expense"
                          onClick={() => removeLine(i)}>×</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-line">
              <tr>
                <td colSpan={5} className="px-3 py-2 text-right text-muted">{t('invoiceForm.subtotal')}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatEur(totals.subtotal)}</td>
                <td />
              </tr>
              {totals.discount_total > 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right text-muted">{t('invoiceForm.discount')}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-expense">
                    −{formatEur(totals.discount_total)}
                  </td>
                  <td />
                </tr>
              )}
              <tr>
                <td colSpan={5} className="px-3 py-2 text-right font-medium">{t('invoiceForm.total')}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{formatEur(totals.total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div>
        <label className="label">{t('invoiceForm.vatNotice')}</label>
        <textarea className="input min-h-[50px] text-xs" value={vatNotice}
          onChange={(e) => setVatNotice(e.target.value)} />
      </div>

      <div>
        <label className="label">{t('common.notes')} <span className="text-muted">{t('common.optional')}</span></label>
        <textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {err && <div className="text-sm text-expense">{err}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : editing ? t('common.save') : t('invoiceForm.createDraft')}
        </button>
      </div>
    </form>
  );
}

function emptyLine(position: number): LineInput {
  return {
    position,
    description: '',
    quantity: '1',
    unit: 'kos',
    unit_price: '0',
    discount_pct: '0',
  };
}
