import { useTranslation } from 'react-i18next';
import type {
  BankAccount, BusinessSettings, Client, Invoice, InvoiceLine,
} from '../lib/types';
import { formatEur, formatDate } from '../lib/format';

interface Props {
  invoice: Invoice;
  lines: InvoiceLine[];
  client: Client | null;
  bank: BankAccount | null;
  business: BusinessSettings | null;
}

/**
 * Single-page printable invoice. Visible in the app and via window.print()
 * — the browser's "Save as PDF" option produces the downloadable file.
 *
 * Layout follows the standard Slovenian invoice convention:
 *   ── issuer  /  invoice number badge
 *   ── client block
 *   ── meta (issue date, service date, due date, place of issue)
 *   ── lines table
 *   ── totals
 *   ── payment instructions (IBAN, BIC, reference number)
 *   ── VAT notice + footer
 */
export default function InvoicePrint({ invoice, lines, client, bank, business }: Props) {
  const { t } = useTranslation();
  const sortedLines = lines.slice().sort((a, b) => a.position - b.position);
  const isProforma = invoice.type === 'proforma';
  const title = isProforma ? t('invoicePrint.proforma') : t('invoicePrint.invoice');

  return (
    <article className="invoice-sheet bg-white text-ink rounded-lg border border-line p-8 md:p-10 print:border-0 print:rounded-none print:p-0 print:bg-white">
      <header className="flex justify-between items-start gap-4 mb-8">
        <div>
          {business && (
            <>
              <div className="font-semibold text-base">{business.legal_name}</div>
              <div className="text-sm text-muted mt-1 leading-relaxed">
                {business.address_line1}
                {business.address_line2 && <><br />{business.address_line2}</>}
                <br />
                {business.postal_code} {business.city}, {business.country}
              </div>
              <div className="text-xs text-muted mt-2 space-y-0.5">
                <div>{t('invoicePrint.taxId')}: {business.tax_id}</div>
                {business.registration_id && (
                  <div>{t('invoicePrint.registrationId')}: {business.registration_id}</div>
                )}
                {business.email && <div>{business.email}</div>}
                {business.phone && <div>{business.phone}</div>}
              </div>
            </>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
          <div className="text-3xl font-semibold tabular-nums mt-1">
            {invoice.invoice_number}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted mb-2">
            {t('invoicePrint.billTo')}
          </div>
          {client ? (
            <div className="text-sm leading-relaxed">
              <div className="font-medium">{client.name}</div>
              {client.address_line1 && <div>{client.address_line1}</div>}
              {client.address_line2 && <div>{client.address_line2}</div>}
              {(client.postal_code || client.city) && (
                <div>{client.postal_code} {client.city}</div>
              )}
              {client.country && <div>{client.country}</div>}
              {client.tax_id && (
                <div className="mt-2 text-xs text-muted">
                  {t('invoicePrint.taxId')}: {client.tax_id}
                </div>
              )}
              {client.email && <div className="text-xs text-muted">{client.email}</div>}
            </div>
          ) : (
            <div className="text-sm text-muted italic">{t('invoicePrint.noClient')}</div>
          )}
        </div>

        <div className="text-sm">
          <div className="grid grid-cols-2 gap-y-1">
            <span className="text-muted">{t('invoicePrint.issueDate')}:</span>
            <span className="text-right">{formatDate(invoice.issue_date)}</span>
            <span className="text-muted">{t('invoicePrint.serviceDate')}:</span>
            <span className="text-right">{formatDate(invoice.service_date)}</span>
            <span className="text-muted">{t('invoicePrint.dueDate')}:</span>
            <span className="text-right font-medium">{formatDate(invoice.due_date)}</span>
            <span className="text-muted">{t('invoicePrint.placeOfIssue')}:</span>
            <span className="text-right">{invoice.place_of_issue}</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <table className="w-full text-sm">
          <thead className="border-b-2 border-ink/30">
            <tr>
              <th className="py-2 text-left font-medium">#</th>
              <th className="py-2 text-left font-medium">{t('common.description')}</th>
              <th className="py-2 text-right font-medium">{t('invoiceForm.qty')}</th>
              <th className="py-2 text-left font-medium">{t('invoiceForm.unit')}</th>
              <th className="py-2 text-right font-medium">{t('invoiceForm.unitPrice')}</th>
              {sortedLines.some((l) => l.discount_pct > 0) && (
                <th className="py-2 text-right font-medium">{t('invoiceForm.discountPct')}</th>
              )}
              <th className="py-2 text-right font-medium">{t('invoiceForm.total')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedLines.map((l, i) => (
              <tr key={l.id} className="border-b border-line">
                <td className="py-2 text-muted">{i + 1}.</td>
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right tabular-nums">{l.quantity}</td>
                <td className="py-2 text-muted">{l.unit ?? ''}</td>
                <td className="py-2 text-right tabular-nums">{formatEur(l.unit_price)}</td>
                {sortedLines.some((line) => line.discount_pct > 0) && (
                  <td className="py-2 text-right tabular-nums">
                    {l.discount_pct > 0 ? `${l.discount_pct}%` : ''}
                  </td>
                )}
                <td className="py-2 text-right tabular-nums">{formatEur(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mb-8">
        <div className="w-full max-w-xs text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">{t('invoiceForm.subtotal')}</span>
            <span className="tabular-nums">{formatEur(invoice.subtotal)}</span>
          </div>
          {invoice.discount_total > 0 && (
            <div className="flex justify-between text-expense">
              <span>{t('invoiceForm.discount')}</span>
              <span className="tabular-nums">−{formatEur(invoice.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-ink/30 pt-2 text-base font-semibold">
            <span>{t('invoicePrint.totalToPay')}</span>
            <span className="tabular-nums">{formatEur(invoice.total)}</span>
          </div>
        </div>
      </section>

      <section className="mb-6 text-sm rounded-md border border-line p-4 bg-canvas print:bg-transparent">
        <div className="font-medium mb-2">{t('invoicePrint.paymentInstructions')}</div>
        {bank ? (
          <div className="grid grid-cols-2 gap-y-1">
            <span className="text-muted">{t('invoicePrint.iban')}:</span>
            <span className="font-mono">{bank.iban}</span>
            {bank.bic && (
              <>
                <span className="text-muted">{t('invoicePrint.bic')}:</span>
                <span className="font-mono">{bank.bic}</span>
              </>
            )}
            {bank.bank_name && (
              <>
                <span className="text-muted">{t('invoicePrint.bank')}:</span>
                <span>{bank.bank_name}</span>
              </>
            )}
            {invoice.reference_number && (
              <>
                <span className="text-muted">{t('invoicePrint.reference')}:</span>
                <span className="font-mono">{invoice.reference_number}</span>
              </>
            )}
          </div>
        ) : (
          <div className="text-muted italic">{t('invoicePrint.noBank')}</div>
        )}
      </section>

      {invoice.notes && (
        <section className="mb-6 text-sm">
          <div className="text-muted text-xs uppercase tracking-wide mb-1">{t('common.notes')}</div>
          <div className="whitespace-pre-line">{invoice.notes}</div>
        </section>
      )}

      <footer className="text-xs text-muted pt-6 border-t border-line space-y-1">
        {invoice.vat_notice && <div>{invoice.vat_notice}</div>}
        {isProforma && <div className="italic">{t('invoicePrint.proformaNotice')}</div>}
      </footer>

      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: white !important; }
          .invoice-sheet { box-shadow: none !important; }
        }
      `}</style>
    </article>
  );
}
