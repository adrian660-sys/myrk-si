import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { FUNDING_SOURCES } from '../lib/constants';
import { formatDate, formatEur, todayIso } from '../lib/format';
import type { FundingSource, Project, ProjectReceipt } from '../lib/types';

export default function Projects() {
  const { t } = useTranslation();
  const { projects, projectReceipts, reload, loading } = useFinanceData();
  const isAdmin = useIsAdmin();
  const [projectModal, setProjectModal] = useState<{ project: Project | null } | null>(null);
  const [receiptModal, setReceiptModal] = useState<Project | null>(null);

  const totalsByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of projectReceipts) {
      map.set(r.project_id, (map.get(r.project_id) ?? 0) + r.amount);
    }
    return map;
  }, [projectReceipts]);

  const receiptsByProject = useMemo(() => {
    const map = new Map<string, ProjectReceipt[]>();
    for (const r of projectReceipts) {
      const list = map.get(r.project_id) ?? [];
      list.push(r);
      map.set(r.project_id, list);
    }
    return map;
  }, [projectReceipts]);

  const grandTotal = projectReceipts.reduce((s, r) => s + r.amount, 0);

  async function deleteProject(id: string) {
    if (!window.confirm('Delete this project? All its receipts will also be deleted.')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    reload();
  }

  async function deleteReceipt(id: string) {
    if (!window.confirm('Delete this receipt?')) return;
    const { error } = await supabase.from('project_receipts').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    reload();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('projects.title')}</h1>
          <p className="text-sm text-muted">
            {t('projects.subtitle')}
            {' '}{t('projects.totalReceived')}: <span className="text-income font-medium">{formatEur(grandTotal)}</span>
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setProjectModal({ project: null })}>
            {t('projects.newProject')}
          </button>
        )}
      </header>

      {loading && <div className="card-pad text-muted">{t('common.loading')}</div>}

      {!loading && projects.length === 0 && (
        <div className="card-pad text-muted">{t('projects.noProjects')}</div>
      )}

      <div className="space-y-3">
        {projects.map((p) => {
          const total = totalsByProject.get(p.id) ?? 0;
          const receipts = receiptsByProject.get(p.id) ?? [];
          return (
            <section key={p.id} className="card">
              <header className="px-5 py-3 border-b border-line flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{p.name}</h2>
                    {!p.active && <span className="chip bg-gray-100 text-gray-700">{t('projects.archived')}</span>}
                  </div>
                  <div className="text-xs text-muted">
                    {formatDate(p.start_date)}{p.end_date ? ` – ${formatDate(p.end_date)}` : ` ${t('projects.ongoing')}`}
                    {p.description && <span> · {p.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-muted">{t('projects.totalReceived')}</div>
                    <div className="font-medium text-income tabular-nums">{formatEur(total)}</div>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col gap-1">
                      <button className="text-xs text-muted hover:text-ink"
                        onClick={() => setReceiptModal(p)}>{t('projects.addReceipt')}</button>
                      <button className="text-xs text-muted hover:text-ink"
                        onClick={() => setProjectModal({ project: p })}>{t('common.edit')}</button>
                      <button className="text-xs text-muted hover:text-expense"
                        onClick={() => deleteProject(p.id)}>{t('common.delete')}</button>
                    </div>
                  )}
                </div>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted text-left bg-canvas/40">
                    <tr>
                      <th className="px-5 py-2 font-medium">{t('common.date')}</th>
                      <th className="px-5 py-2 font-medium">{t('common.source')}</th>
                      <th className="px-5 py-2 font-medium">{t('common.notes')}</th>
                      <th className="px-5 py-2 font-medium text-right">{t('common.amount')}</th>
                      {isAdmin && <th className="px-5 py-2 font-medium" />}
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.length === 0 && (
                      <tr><td colSpan={isAdmin ? 5 : 4} className="px-5 py-3 text-muted">{t('projects.noReceipts')}</td></tr>
                    )}
                    {receipts.map((r) => (
                      <tr key={r.id} className="border-t border-line">
                        <td className="px-5 py-2">{formatDate(r.date)}</td>
                        <td className="px-5 py-2">
                          <span className="chip bg-canvas border border-line">{r.funding_source}</span>
                        </td>
                        <td className="px-5 py-2 text-muted">{r.notes ?? t('common.dash')}</td>
                        <td className="px-5 py-2 text-right tabular-nums text-income">
                          {formatEur(r.amount)}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-2 text-right">
                            <button className="text-xs text-muted hover:text-expense"
                              onClick={() => deleteReceipt(r.id)}>{t('common.delete')}</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <Modal
        open={!!projectModal}
        onClose={() => setProjectModal(null)}
        title={projectModal?.project ? t('projects.editProjectTitle') : t('projects.newProjectTitle')}
      >
        {projectModal && (
          <ProjectForm
            initial={projectModal.project}
            onSaved={() => { setProjectModal(null); reload(); }}
            onCancel={() => setProjectModal(null)}
          />
        )}
      </Modal>

      <Modal open={!!receiptModal} onClose={() => setReceiptModal(null)} title={t('projects.addReceiptTitle')}>
        {receiptModal && (
          <ReceiptForm
            project={receiptModal}
            onSaved={() => { setReceiptModal(null); reload(); }}
            onCancel={() => setReceiptModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function ProjectForm({
  initial, onSaved, onCancel,
}: {
  initial: Project | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date ?? todayIso());
  const [endDate, setEndDate] = useState(initial?.end_date ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError(t('projects.nameRequired')); return; }
    if (endDate && endDate < startDate) { setError(t('common.endBeforeStart')); return; }

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      active,
      notes: notes.trim() || null,
    };
    const { error: err } = initial
      ? await supabase.from('projects').update(payload).eq('id', initial.id)
      : await supabase.from('projects').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t('common.name')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('common.description')} <span className="text-muted">{t('common.optional')}</span></label>
        <input className="input" value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('common.start')}</label>
          <input className="input" type="date" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('common.end')} <span className="text-muted">{t('common.optional')}</span></label>
          <input className="input" type="date" value={endDate}
            onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active}
          onChange={(e) => setActive(e.target.checked)} />
        {t('common.active')}
      </label>
      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input" value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : initial ? t('projects.saveProject') : t('projects.createProject')}
        </button>
      </div>
    </form>
  );
}

function ReceiptForm({
  project, onSaved, onCancel,
}: {
  project: Project;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState<FundingSource>('DH');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) { setError(t('common.enterPositiveAmount')); return; }

    setSaving(true);
    const { error: err } = await supabase.from('project_receipts').insert({
      project_id: project.id, amount: n, date, funding_source: source,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm text-muted">
        {t('projects.projectLabel')} <span className="text-ink font-medium">{project.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('common.amountEur')}</label>
          <input className="input" type="number" step="0.01" min="0.01"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="label">{t('common.receivedVia')}</label>
          <select className="input" value={source}
            onChange={(e) => setSource(e.target.value as FundingSource)}>
            {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">{t('common.date')}</label>
        <input className="input" type="date" value={date}
          onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('common.notes')}</label>
        <input className="input" value={notes}
          onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <div className="text-sm text-expense">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('common.saving') : t('common.recordReceipt')}
        </button>
      </div>
    </form>
  );
}
