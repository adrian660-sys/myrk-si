import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  BankAccount, BusinessSettings, Client, Invoice, InvoiceLine,
} from '../lib/types';

export const PM_INVOICING_CHANGED = 'pmf:invoicing-changed';

export function notifyInvoicingChanged() {
  window.dispatchEvent(new Event(PM_INVOICING_CHANGED));
}

export interface InvoicingData {
  business: BusinessSettings | null;
  bankAccounts: BankAccount[];
  clients: Client[];
  invoices: Invoice[];
  invoiceLines: InvoiceLine[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useInvoicingData(): InvoicingData {
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const [bs, ba, cl, inv, il] = await Promise.all([
      supabase.from('business_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('bank_accounts').select('*').order('position'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('invoices').select('*').order('issue_date', { ascending: false }),
      supabase.from('invoice_lines').select('*').order('position'),
    ]);
    const optional = /business_settings|bank_accounts|clients|invoices|invoice_lines/;
    const firstError =
      (bs.error && !optional.test(bs.error.message) ? bs.error : null) ??
      (ba.error && !optional.test(ba.error.message) ? ba.error : null) ??
      (cl.error && !optional.test(cl.error.message) ? cl.error : null) ??
      (inv.error && !optional.test(inv.error.message) ? inv.error : null) ??
      (il.error && !optional.test(il.error.message) ? il.error : null);
    if (firstError) setError(firstError.message);

    setBusiness((bs.data as BusinessSettings) ?? null);
    setBankAccounts((ba.data as BankAccount[]) ?? []);
    setClients((cl.data as Client[]) ?? []);
    setInvoices((inv.data as Invoice[]) ?? []);
    setInvoiceLines((il.data as InvoiceLine[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(PM_INVOICING_CHANGED, onChange);
    return () => window.removeEventListener(PM_INVOICING_CHANGED, onChange);
  }, [reload]);

  return { business, bankAccounts, clients, invoices, invoiceLines, loading, error, reload };
}
