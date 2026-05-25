import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInvoicingData } from '../hooks/useInvoicingData';
import { useIsAdmin } from '../hooks/useAuth';
import { formatEur, formatDate } from '../lib/format';
import type { InvoiceStatus, InvoiceType } from '../lib/types';

export default function Invoices() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { invoices, clients, loading } = useInvoicingData();

  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const clientById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of clients) m.set(c.id, c.name);
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (typeFilter !== 'all' && inv.type !== typeFilter) return false;
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, typeFilter, statusFilter]);

  const totals = useMemo(() => {
    let outstanding = 0, paid = 0, draft = 0;
    for (const inv of invoices) {
      if (inv.type === 'proforma') continue;
      if (inv.status === 'paid') paid += inv.total;
      else if (inv.status === 'draft') draft += inv.total;
      else if (inv.status === 'sent') outstanding += inv.total;
    }
    return { outstanding, paid, draft };
  }, [invoices]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t('invoices.title')}</h1>
          <p className="text-sm text-muted">{t('invoices.subtitle')}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link to="/invoices/new?type=proforma" className="btn-secondary">
              {t('invoices.newProforma')}
            </Link>
            <Link to="/invoices/new" className="btn-primary">
              {t('invoices.newInvoice')}
            </Link>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card-pad">
          <div className="text-xs uppercase tracking-wide text-muted">{t('invoices.outstanding')}</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-expense">
            {formatEur(totals.outstanding)}
          </div>
        </div>
        <div className="card-pad">
          <div className="text-xs uppercase tracking-wide text-muted">{t('invoices.paidTotal')}</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-income">
            {formatEur(totals.paid)}
          </div>
        </div>
        <div className="card-pad">
          <div className="text-xs uppercase tracking-wide text-muted">{t('invoices.draftTotal')}</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {formatEur(totals.draft)}
          </div>
        </div>
      </div>

      <div className="card-pad flex flex-wrap gap-3 text-sm">
        <div>
          <label className="label">{t('invoices.typeFilter')}</label>
          <select className="input" value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as InvoiceType | 'all')}>
            <option value="all">{t('common.all')}</option>
            <option value="invoice">{t('invoices.typeInvoice')}</option>
            <option value="proforma">{t('invoices.typeProforma')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('invoices.statusFilter')}</label>
          <select className="input" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}>
            <option value="all">{t('common.all')}</option>
            <option value="draft">{t('invoices.statusDraft')}</option>
            <option value="sent">{t('invoices.statusSent')}</option>
            <option value="paid">{t('invoices.statusPaid')}</option>
            <option value="cancelled">{t('invoices.statusCancelled')}</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t('invoices.number')}</th>
              <th className="px-4 py-2 font-medium">{t('invoices.client')}</th>
              <th className="px-4 py-2 font-medium">{t('invoices.issueDate')}</th>
              <th className="px-4 py-2 font-medium">{t('invoices.dueDate')}</th>
              <th className="px-4 py-2 font-medium">{t('invoices.status')}</th>
              <th className="px-4 py-2 font-medium text-right">{t('invoices.total')}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-muted text-center">{t('common.loading')}</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-muted text-center">{t('invoices.empty')}</td></tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-t border-line">
                <td className="px-4 py-2 font-medium">
                  <Link to={`/invoices/${inv.id}`} className="hover:underline">
                    {inv.invoice_number}
                  </Link>
                  {inv.type === 'proforma' && (
                    <span className="ml-1 chip bg-amber-100 text-amber-800 text-xs">
                      {t('invoices.typeProforma')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{clientById.get(inv.client_id) ?? '—'}</td>
                <td className="px-4 py-2 text-muted">{formatDate(inv.issue_date)}</td>
                <td className="px-4 py-2 text-muted">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-2">
                  <StatusChip status={inv.status} />
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">
                  {formatEur(inv.total)}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/invoices/${inv.id}`} className="text-xs text-muted hover:text-ink">
                    {t('common.review')} →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  const cls = {
    draft: 'bg-gray-200 text-gray-700',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-100 text-gray-500',
  }[status];
  return (
    <span className={`chip ${cls}`}>
      {t(`invoices.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
    </span>
  );
}
