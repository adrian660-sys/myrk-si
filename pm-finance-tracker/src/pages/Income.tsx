import { useState } from 'react';
import Modal from '../components/Modal';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatDate, formatEur, formatSigned, todayIso } from '../lib/format';
import type { IncomeRecord, IncomeFundingSource } from '../lib/types';

export default function Income() {
  const { incomeRecords, reload, loading } = useFinanceData();
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState<IncomeRecord | null>(null);
  const [adding, setAdding] = useState(false);

  const total = incomeRecords.reduce((s, r) => s + r.amount, 0);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this income record?')) return;
    const { error } = await supabase.from('income_records').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    reload();
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Income</h1>
          <p className="text-sm text-muted">
            Research payments received via DH or Revolut.
            Total: <span className="text-income font-medium">{formatEur(total)}</span>
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setAdding(true)}>
            + Add income
          </button>
        )}
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left bg-canvas/40">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Notes</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
              {isAdmin && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted text-center">Loading…</td></tr>
            )}
            {!loading && incomeRecords.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted text-center">No income records yet.</td></tr>
            )}
            {incomeRecords.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2">{formatDate(r.date)}</td>
                <td className="px-4 py-2">{r.description}</td>
                <td className="px-4 py-2">
                  <span className="chip bg-canvas border border-line">{r.funding_source}</span>
                </td>
                <td className="px-4 py-2 text-muted">{r.notes ?? '—'}</td>
                <td className="px-4 py-2 text-right tabular-nums text-income font-medium">
                  {formatSigned(r.amount)}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button className="text-xs text-muted hover:text-ink mr-2"
                      onClick={() => setEditing(r)}>Edit</button>
                    <button className="text-xs text-muted hover:text-expense"
                      onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add income">
        <IncomeForm
          initial={null}
          onSaved={() => { setAdding(false); reload(); }}
          onCancel={() => setAdding(false)}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit income">
        {editing && (
          <IncomeForm
            initial={editing}
            onSaved={() => { setEditing(null); reload(); }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function IncomeForm({
  initial, onSaved, onCancel,
}: {
  initial: IncomeRecord | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? 'Research Payment');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [source, setSource] = useState<IncomeFundingSource>(initial?.funding_source ?? 'DH');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) { setError('Enter a positive amount.'); return; }
    if (!description.trim()) { setError('Description required.'); return; }

    setSaving(true);
    const payload = {
      date,
      description: description.trim(),
      amount: n,
      funding_source: source,
      notes: notes.trim() || null,
    };
    const { error: err } = initial
      ? await supabase.from('income_records').update(payload).eq('id', initial.id)
      : await supabase.from('income_records').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Date</label>
        <input className="input" type="date" value={date}
          onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (€)</label>
          <input className="input" type="number" step="0.01" min="0.01"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="label">Received via</label>
          <select className="input" value={source}
            onChange={(e) => setSource(e.target.value as IncomeFundingSource)}>
            <option value="DH">DH</option>
            <option value="Revolut">Revolut</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <input className="input" value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save' : 'Add income'}
        </button>
      </div>
    </form>
  );
}
