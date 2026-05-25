import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import { useInvoicingData, notifyInvoicingChanged } from '../hooks/useInvoicingData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Client } from '../lib/types';

export default function Clients() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { clients, loading } = useInvoicingData();
  const [editing, setEditing] = useState<Client | null | 'new'>(null);

  async function remove(id: string) {
    if (!confirm(t('clients.confirmDelete'))) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    notifyInvoicingChanged();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t('clients.title')}</h1>
          <p className="text-sm text-muted">{t('clients.subtitle')}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setEditing('new')}>
            {t('clients.newClient')}
          </button>
        )}
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t('common.name')}</th>
              <th className="px-4 py-2 font-medium">{t('clients.type')}</th>
              <th className="px-4 py-2 font-medium">{t('clients.taxId')}</th>
              <th className="px-4 py-2 font-medium">{t('clients.city')}</th>
              <th className="px-4 py-2 font-medium">{t('common.description')}</th>
              {isAdmin && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted text-center">{t('common.loading')}</td></tr>
            )}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted text-center">{t('clients.empty')}</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-muted">
                  {c.is_company ? t('clients.company') : t('clients.individual')}
                </td>
                <td className="px-4 py-2 text-muted">{c.tax_id ?? '—'}</td>
                <td className="px-4 py-2 text-muted">{c.city ?? '—'}</td>
                <td className="px-4 py-2 text-muted truncate max-w-xs">{c.email ?? c.notes ?? '—'}</td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setEditing(c)}>{t('common.edit')}</button>
                    <button className="text-xs text-muted hover:text-expense"
                      onClick={() => remove(c.id)}>{t('common.delete')}</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t('clients.newClient') : t('clients.editClient')}
      >
        {editing && (
          <ClientForm
            initial={editing === 'new' ? null : editing}
            onSaved={() => { setEditing(null); notifyInvoicingChanged(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ClientForm({
  initial, onSaved, onCancel,
}: {
  initial: Client | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [isCompany, setIsCompany] = useState(initial?.is_company ?? true);
  const [addr1, setAddr1] = useState(initial?.address_line1 ?? '');
  const [addr2, setAddr2] = useState(initial?.address_line2 ?? '');
  const [postal, setPostal] = useState(initial?.postal_code ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [country, setCountry] = useState(initial?.country ?? 'Slovenija');
  const [taxId, setTaxId] = useState(initial?.tax_id ?? '');
  const [regId, setRegId] = useState(initial?.registration_id ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr(t('clients.nameRequired')); return; }
    setSaving(true);
    const payload = {
      name: name.trim(),
      is_company: isCompany,
      address_line1: addr1.trim() || null,
      address_line2: addr2.trim() || null,
      postal_code: postal.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      tax_id: taxId.trim() || null,
      registration_id: regId.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    };
    const { error } = initial
      ? await supabase.from('clients').update(payload).eq('id', initial.id)
      : await supabase.from('clients').insert(payload);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t('common.name')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={isCompany ? 'Acme d.o.o.' : 'Janez Novak'} />
      </div>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={isCompany} onChange={() => setIsCompany(true)} />
          {t('clients.company')}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!isCompany} onChange={() => setIsCompany(false)} />
          {t('clients.individual')}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('clients.addressLine1')}</label>
          <input className="input" value={addr1} onChange={(e) => setAddr1(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('clients.addressLine2')} <span className="text-muted">{t('common.optional')}</span></label>
          <input className="input" value={addr2} onChange={(e) => setAddr2(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">{t('clients.postalCode')}</label>
          <input className="input" value={postal} onChange={(e) => setPostal(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('clients.city')}</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('clients.country')}</label>
          <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>

      {isCompany && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('clients.taxId')}</label>
            <input className="input" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('clients.registrationId')}</label>
            <input className="input" value={regId} onChange={(e) => setRegId(e.target.value)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('clients.emailLabel')}</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('clients.phone')}</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {err && <div className="text-sm text-expense">{err}</div>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : initial ? t('common.save') : t('clients.createClient')}
        </button>
      </div>
    </form>
  );
}
