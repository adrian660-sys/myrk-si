import { useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInvoicingData, notifyInvoicingChanged } from '../hooks/useInvoicingData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePrint from '../components/InvoicePrint';
import { formatEur, formatDate, todayIso } from '../lib/format';
import { nextInvoiceSequence, formatInvoiceNumber, formatReferenceNumber } from '../lib/invoicing';

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const { id } = useParams();
  const [search] = useSearchParams();
  const newType = (search.get('type') === 'proforma' ? 'proforma' : 'invoice') as 'invoice' | 'proforma';
  const isNew = !id || id === 'new';

  const { business, bankAccounts, clients, invoices, invoiceLines, loading } = useInvoicingData();
  const [editing, setEditing] = useState(isNew);

  const invoice = useMemo(
    () => (isNew ? null : invoices.find((inv) => inv.id === id) ?? null),
    [invoices, id, isNew]
  );
  const lines = useMemo(
    () => (invoice ? invoiceLines.filter((l) => l.invoice_id === invoice.id) : []),
    [invoiceLines, invoice]
  );
  const client = useMemo(
    () => (invoice ? clients.find((c) => c.id === invoice.client_id) ?? null : null),
    [clients, invoice]
  );
  const bank = useMemo(
    () => (invoice ? bankAccounts.find((b) => b.id === invoice.bank_account_id) ?? null : null),
    [bankAccounts, invoice]
  );

  if (loading) return <div className="p-6 text-muted">{t('common.loading')}</div>;
  if (!isNew && !invoice) {
    return (
      <div className="p-6">
        <div className="text-expense">{t('invoices.notFound')}</div>
        <Link to="/invoices" className="text-sm text-muted hover:text-ink mt-2 inline-block">
          ← {t('invoices.title')}
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <Link to="/invoices" className="text-sm text-muted hover:text-ink">
          ← {t('invoices.title')}
        </Link>
        <h1 className="text-2xl font-semibold mt-2 mb-4">
          {isNew
            ? newType === 'proforma' ? t('invoices.newProforma') : t('invoices.newInvoice')
            : t('invoices.editInvoice')}
        </h1>
        <InvoiceForm
          initial={invoice}
          initialType={isNew ? newType : invoice!.type}
          business={business}
          bankAccounts={bankAccounts}
          clients={clients}
          existingLines={lines}
          onSaved={(savedId) => {
            notifyInvoicingChanged();
            if (isNew) navigate(`/invoices/${savedId}`);
            else setEditing(false);
          }}
          onCancel={() => {
            if (isNew) navigate('/invoices');
            else setEditing(false);
          }}
        />
      </div>
    );
  }

  // VIEW MODE — show invoice + actions

  async function markSent() {
    if (!invoice) return;
    const { error } = await supabase.from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invoice.id);
    if (error) { alert(error.message); return; }
    notifyInvoicingChanged();
  }

  async function markPaid() {
    if (!invoice) return;
    const { error } = await supabase.from('invoices')
      .update({ status: 'paid', paid_on: todayIso() })
      .eq('id', invoice.id);
    if (error) { alert(error.message); return; }
    notifyInvoicingChanged();
  }

  async function reopen() {
    if (!invoice) return;
    const { error } = await supabase.from('invoices')
      .update({ status: 'sent', paid_on: null, transaction_id: null, project_receipt_id: null })
      .eq('id', invoice.id);
    if (error) { alert(error.message); return; }
    notifyInvoicingChanged();
  }

  async function cancelInvoice() {
    if (!invoice) return;
    if (!confirm(t('invoices.confirmCancel'))) return;
    const { error } = await supabase.from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', invoice.id);
    if (error) { alert(error.message); return; }
    notifyInvoicingChanged();
  }

  async function deleteInvoice() {
    if (!invoice) return;
    if (!confirm(t('invoices.confirmDelete'))) return;
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
    if (error) { alert(error.message); return; }
    notifyInvoicingChanged();
    navigate('/invoices');
  }

  async function convertToInvoice() {
    if (!invoice || invoice.type !== 'proforma') return;
    if (!confirm(t('invoices.confirmConvert'))) return;
    const today = todayIso();
    const year = parseInt(today.slice(0, 4), 10);
    const seq = await nextInvoiceSequence('invoice', year);

    const { data, error } = await supabase.from('invoices').insert({
      type: 'invoice',
      invoice_number: formatInvoiceNumber('invoice', year, seq),
      sequence_year: year,
      sequence_in_year: seq,
      reference_number: formatReferenceNumber(year, seq),
      client_id: invoice.client_id,
      bank_account_id: invoice.bank_account_id,
      issue_date: today,
      service_date: invoice.service_date,
      due_date: invoice.due_date,
      status: 'draft',
      subtotal: invoice.subtotal,
      discount_total: invoice.discount_total,
      total: invoice.total,
      place_of_issue: invoice.place_of_issue,
      vat_notice: invoice.vat_notice,
      notes: invoice.notes,
    }).select('id').single();
    if (error || !data) { alert(error?.message ?? 'Convert failed'); return; }

    // Copy lines.
    const newLines = lines.map((l) => ({
      invoice_id: data.id,
      position: l.position,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unit_price,
      discount_pct: l.discount_pct,
      total: l.total,
    }));
    if (newLines.length > 0) {
      const { error: linesErr } = await supabase.from('invoice_lines').insert(newLines);
      if (linesErr) { alert(linesErr.message); return; }
    }
    notifyInvoicingChanged();
    navigate(`/invoices/${data.id}`);
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 print:p-0 print:max-w-none">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <Link to="/invoices" className="text-sm text-muted hover:text-ink">
          ← {t('invoices.title')}
        </Link>
        <div className="flex gap-2">
          {isAdmin && invoice!.status === 'draft' && (
            <>
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                {t('common.edit')}
              </button>
              <button className="btn-secondary" onClick={markSent}>
                {t('invoices.markSent')}
              </button>
            </>
          )}
          {isAdmin && invoice!.status === 'sent' && (
            <button className="btn-primary" onClick={markPaid}>
              {t('invoices.markPaid')}
            </button>
          )}
          {isAdmin && invoice!.status === 'paid' && (
            <button className="btn-secondary" onClick={reopen}>
              {t('invoices.reopen')}
            </button>
          )}
          {isAdmin && invoice!.type === 'proforma' && invoice!.status !== 'cancelled' && (
            <button className="btn-primary" onClick={convertToInvoice}>
              {t('invoices.convertToInvoice')}
            </button>
          )}
          <button className="btn-secondary" onClick={() => window.print()}>
            {t('invoices.print')}
          </button>
          {isAdmin && invoice!.status !== 'cancelled' && invoice!.status !== 'paid' && (
            <button className="text-sm text-muted hover:text-expense" onClick={cancelInvoice}>
              {t('invoices.cancel')}
            </button>
          )}
          {isAdmin && invoice!.status === 'draft' && (
            <button className="text-sm text-muted hover:text-expense" onClick={deleteInvoice}>
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>

      {invoice!.status === 'paid' && (
        <div className="card-pad border-l-4 border-emerald-500 print:hidden">
          <div className="text-sm">
            ✓ <strong>{t('invoices.statusPaid')}</strong>
            {invoice!.paid_on && <span className="text-muted"> · {formatDate(invoice!.paid_on)}</span>}
            {invoice!.transaction_id && (
              <span className="text-muted">
                {' · '}{t('invoices.linkedToTransaction')}
              </span>
            )}
          </div>
        </div>
      )}

      <InvoicePrint
        invoice={invoice!}
        lines={lines}
        client={client}
        bank={bank}
        business={business}
      />

      {(invoice!.total > 0 || lines.length > 0) && (
        <div className="text-xs text-muted print:hidden">
          {t('invoices.totalShown')}: <span className="tabular-nums font-medium text-ink">{formatEur(invoice!.total)}</span>
        </div>
      )}
    </div>
  );
}
