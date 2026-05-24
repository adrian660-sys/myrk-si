import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useFinanceData } from '../hooks/useFinanceData';
import { parseCsv } from '../lib/parsers';
import { FUNDING_SOURCES } from '../lib/constants';
import type {
  Category, FundingSource, ImportLog, ImportSource, ParsedTransaction, Transaction,
} from '../lib/types';
import { formatDate, formatSigned } from '../lib/format';

type ImportKind = 'DH_PDF' | 'Revolut_PDF' | 'CSV';

interface PreparedImport {
  kind: ImportKind;
  filename: string;
  rows: ParsedTransaction[];
  storagePath: string | null;
  driveFileId: string | null;
  driveUrl: string | null;
}

export default function Import() {
  const { email, role } = useAuth();
  const { trips, transactions, categories, subcategories, reload } = useFinanceData();
  const [kind, setKind] = useState<ImportKind>('DH_PDF');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'idle' | 'uploading' | 'parsing' | 'importing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedImport | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadLogs() {
    const { data } = await supabase
      .from('import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setLogs((data as ImportLog[]) ?? []);
  }

  useEffect(() => { loadLogs(); }, [prepared]);

  async function deleteBatch(log: ImportLog) {
    if (!log.import_batch_id) {
      alert('This import was made before batch tracking was added. Use the Transactions page or a SQL delete instead.');
      return;
    }
    const confirmed = window.confirm(
      `Delete all ${log.rows_imported} transaction${log.rows_imported === 1 ? '' : 's'} from "${log.filename}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;
    setDeleting(log.id);
    const { error: err } = await supabase
      .from('transactions')
      .delete()
      .eq('import_batch_id', log.import_batch_id);
    if (err) { alert(err.message); setDeleting(null); return; }
    // Mark the log as undone by zeroing the row count; keep the log for audit.
    await supabase.from('import_logs')
      .update({ rows_imported: 0 })
      .eq('id', log.id);
    setDeleting(null);
    await Promise.all([loadLogs(), reload()]);
  }

  function reset() {
    setFile(null);
    setPrepared(null);
    setError(null);
    setBusy('idle');
  }

  async function handlePrepare() {
    if (!file) return;
    setError(null);

    if (kind === 'CSV') {
      try {
        setBusy('parsing');
        const text = await file.text();
        const raw = parseCsv(text, trips, categories);
        const rows = markDuplicates(raw, transactions);
        const { storagePath } = await uploadToStorage(file, kind);
        const drive = await callDriveUpload(storagePath, file.name, kind).catch(() => null);
        setPrepared({
          kind, filename: file.name, rows, storagePath,
          driveFileId: drive?.fileId ?? null,
          driveUrl: drive?.url ?? null,
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy('idle');
      }
      return;
    }

    // PDF path → edge function does upload + parsing.
    try {
      setBusy('uploading');
      const { storagePath } = await uploadToStorage(file, kind);
      setBusy('parsing');
      const parsed = await callParseStatement(storagePath, kind);
      const rows = markDuplicates(parsed, transactions);
      const drive = await callDriveUpload(storagePath, file.name, kind).catch(() => null);
      setPrepared({
        kind, filename: file.name, rows, storagePath,
        driveFileId: drive?.fileId ?? null,
        driveUrl: drive?.url ?? null,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('idle');
    }
  }

  async function handleConfirm() {
    if (!prepared) return;
    if (role !== 'admin') {
      setError('Only the admin may finalise an import.');
      return;
    }
    setBusy('importing');
    setError(null);

    const batchId = crypto.randomUUID();
    // Only rows the user explicitly ticked are imported; duplicates can't be
    // overridden because Supabase would reject them anyway.
    const toInsert = prepared.rows.filter((r) => r.include && !r.duplicate);
    const payload = toInsert.map((r) => ({
      date: r.date,
      description: r.description,
      funding_source: r.funding_source,
      category: r.category,
      subcategory: r.subcategory,
      amount: r.amount,
      notes: r.notes,
      bill_status: r.bill_status,
      trip_id: r.trip_id,
      import_source: prepared.kind === 'CSV' ? 'CSV' : (prepared.kind as ImportSource),
      import_batch_id: batchId,
    }));

    const insert = payload.length > 0
      ? await supabase.from('transactions').insert(payload)
      : { error: null };

    if (insert.error) {
      setError(insert.error.message);
      setBusy('idle');
      return;
    }

    await supabase.from('import_logs').insert({
      source: prepared.kind,
      filename: prepared.filename,
      rows_imported: payload.length,
      rows_skipped: prepared.rows.length - payload.length,
      supabase_storage_path: prepared.storagePath,
      google_drive_file_id: prepared.driveFileId,
      google_drive_url: prepared.driveUrl,
      import_batch_id: batchId,
      uploaded_by: email,
    });

    setBusy('idle');
    setPrepared(null);
    setFile(null);
    reload();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Import</h1>
        <p className="text-sm text-muted">
          Upload a DH PDF, Revolut PDF, or a CSV migration file. Files are stored on Supabase
          Storage and mirrored to Google Drive for the accountant.
        </p>
      </header>

      {!prepared && (
        <div className="card-pad space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            {(['DH_PDF', 'Revolut_PDF', 'CSV'] as ImportKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => { setKind(k); setFile(null); }}
                className={`text-left rounded-md border p-3 ${
                  kind === k ? 'border-ink bg-canvas' : 'border-line hover:border-ink/40'
                }`}
              >
                <div className="font-medium">{labelFor(k)}</div>
                <div className="text-xs text-muted mt-1">{descriptionFor(k)}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="label">File</label>
            <input
              className="input"
              type="file"
              accept={kind === 'CSV' ? '.csv,text/csv' : 'application/pdf,.pdf'}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <div className="text-sm text-expense">{error}</div>}

          <div className="flex justify-end">
            <button className="btn-primary" disabled={!file || busy !== 'idle'} onClick={handlePrepare}>
              {busy === 'uploading' ? 'Uploading…'
                : busy === 'parsing' ? 'Parsing…'
                : 'Parse & review'}
            </button>
          </div>
        </div>
      )}

      {prepared && (
        <ReviewTable
          prepared={prepared}
          onChange={(rows) => setPrepared({ ...prepared, rows })}
          onCancel={reset}
          onConfirm={handleConfirm}
          busy={busy === 'importing'}
          error={error}
          trips={trips}
          canConfirm={role === 'admin'}
          categories={categories}
          subcategories={subcategories}
        />
      )}

      <section className="card">
        <header className="px-5 py-3 border-b border-line">
          <h2 className="font-semibold">Recent imports</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-left">
              <tr>
                <th className="px-5 py-2 font-medium">When</th>
                <th className="px-5 py-2 font-medium">Source</th>
                <th className="px-5 py-2 font-medium">File</th>
                <th className="px-5 py-2 font-medium text-right">Imported</th>
                <th className="px-5 py-2 font-medium text-right">Skipped</th>
                <th className="px-5 py-2 font-medium">Drive</th>
                <th className="px-5 py-2 font-medium">By</th>
                {role === 'admin' && <th className="px-5 py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={role === 'admin' ? 8 : 7} className="px-5 py-4 text-muted">No imports yet.</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="px-5 py-2 text-muted">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-5 py-2">{labelFor(l.source)}</td>
                  <td className="px-5 py-2">{l.filename ?? '—'}</td>
                  <td className="px-5 py-2 text-right tabular-nums">{l.rows_imported}</td>
                  <td className="px-5 py-2 text-right tabular-nums text-muted">{l.rows_skipped}</td>
                  <td className="px-5 py-2">
                    {l.google_drive_url ? (
                      <a className="text-accent hover:underline" href={l.google_drive_url}
                         target="_blank" rel="noreferrer">Open</a>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-5 py-2 text-muted">{l.uploaded_by ?? '—'}</td>
                  {role === 'admin' && (
                    <td className="px-5 py-2 text-right">
                      {l.rows_imported > 0 && l.import_batch_id ? (
                        <button
                          className="text-xs text-muted hover:text-expense"
                          disabled={deleting === l.id}
                          onClick={() => deleteBatch(l)}
                        >
                          {deleting === l.id ? 'Deleting…' : 'Delete imported'}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReviewTable({
  prepared, onChange, onConfirm, onCancel, busy, error, trips, canConfirm,
  categories, subcategories,
}: {
  prepared: PreparedImport;
  onChange: (rows: ParsedTransaction[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  error: string | null;
  trips: { id: string; name: string }[];
  canConfirm: boolean;
  categories: Category[];
  subcategories: Record<string, string[]>;
}) {
  const stats = useMemo(() => {
    const dup = prepared.rows.filter((r) => r.duplicate).length;
    const review = prepared.rows.filter((r) => r.needsReview && !r.duplicate).length;
    const willImport = prepared.rows.filter((r) => r.include && !r.duplicate).length;
    const skipped = prepared.rows.length - willImport;
    return { total: prepared.rows.length, dup, review, willImport, skipped };
  }, [prepared.rows]);

  function update(i: number, patch: Partial<ParsedTransaction>) {
    const next = prepared.rows.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function setAllInclude(value: boolean) {
    // Duplicates are never importable, regardless of the toggle.
    onChange(prepared.rows.map((r) => ({ ...r, include: value && !r.duplicate })));
  }

  return (
    <div className="space-y-4">
      <div className="card-pad flex flex-wrap items-center gap-3">
        <div>
          <div className="font-medium">{prepared.filename}</div>
          <div className="text-sm text-muted">
            {stats.total} rows · <span className="text-income font-medium">{stats.willImport} will import</span>
            {' · '}<span>{stats.skipped} skip</span>
            {stats.dup > 0 && <> · {stats.dup} duplicates</>}
            {stats.review > 0 && <> · {stats.review} unmatched</>}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setAllInclude(true)} disabled={busy}>
            Select all
          </button>
          <button className="btn-secondary" onClick={() => setAllInclude(false)} disabled={busy}>
            Deselect all
          </button>
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}
            disabled={busy || !canConfirm || stats.willImport === 0}>
            {busy ? 'Importing…'
              : !canConfirm ? 'Admin only'
              : `Import ${stats.willImport} row${stats.willImport === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-expense">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="px-3 py-2 font-medium w-10">
                <span className="sr-only">Import</span>
              </th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Subcategory</th>
              <th className="px-3 py-2 font-medium">Trip</th>
              <th className="px-3 py-2 font-medium text-right">Amount</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {prepared.rows.map((r, i) => {
              const subs = subcategories[r.category] ?? [];
              const tone = r.duplicate ? 'bg-gray-50 text-muted'
                : !r.include ? 'bg-gray-50 text-muted'
                : r.needsReview ? 'bg-amber-50' : '';
              return (
                <tr key={i} className={`border-t border-line ${tone}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={r.include}
                      disabled={r.duplicate}
                      onChange={(e) => update(i, { include: e.target.checked })}
                      aria-label="Include in import"
                    />
                  </td>
                  <td className="px-3 py-2">{r.date ? formatDate(r.date) : '—'}</td>
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2">
                    <select className="input py-1" value={r.funding_source}
                      onChange={(e) => update(i, { funding_source: e.target.value as FundingSource })}>
                      {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className="input py-1" value={r.category}
                      onChange={(e) => {
                        const c = e.target.value as Category;
                        const sub = subcategories[c]?.[0] ?? null;
                        update(i, { category: c, subcategory: sub, needsReview: false });
                      }}>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className="input py-1" value={r.subcategory ?? ''}
                      onChange={(e) => update(i, { subcategory: e.target.value || null })}
                      disabled={subs.length === 0}>
                      {subs.length === 0
                        ? <option value="">—</option>
                        : subs.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className="input py-1" value={r.trip_id ?? ''}
                      onChange={(e) => update(i, { trip_id: e.target.value || null })}>
                      <option value="">—</option>
                      {trips.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${r.amount >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatSigned(r.amount)}
                  </td>
                  <td className="px-3 py-2">
                    {r.duplicate
                      ? <span className="chip bg-gray-200 text-gray-700">duplicate</span>
                      : r.needsReview
                        ? <span className="chip bg-amber-100 text-amber-800">review</span>
                        : <span className="chip bg-emerald-100 text-emerald-800">ready</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function markDuplicates(
  rows: ParsedTransaction[],
  existing: Transaction[]
): ParsedTransaction[] {
  // Same date + amount + description (case-insensitive) counts as a duplicate.
  const key = (date: string | null, amount: number, desc: string) =>
    `${date ?? ''}|${amount.toFixed(2)}|${desc.trim().toLowerCase()}`;
  const seen = new Set(existing.map((t) => key(t.date, t.amount, t.description)));
  return rows.map((r) => ({
    ...r,
    duplicate: seen.has(key(r.date, r.amount, r.description)),
  }));
}

async function uploadToStorage(file: File, kind: ImportKind): Promise<{ storagePath: string }> {
  const source = kind === 'DH_PDF' ? 'DH' : kind === 'Revolut_PDF' ? 'Revolut' : 'CSV';
  const year = new Date().getFullYear();
  const ts = Date.now();
  const safeName = file.name.replace(/[^a-z0-9._-]+/gi, '_');
  const path = `${source}/${year}/${ts}_${safeName}`;
  const { error } = await supabase.storage.from('bank-statements').upload(path, file, {
    upsert: false,
    contentType: file.type || (kind === 'CSV' ? 'text/csv' : 'application/pdf'),
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return { storagePath: path };
}

async function callParseStatement(
  storagePath: string,
  kind: ImportKind
): Promise<ParsedTransaction[]> {
  const { data, error } = await supabase.functions.invoke('parse-statement', {
    body: { path: storagePath, kind },
  });
  if (error) throw new Error(`Parser failed: ${error.message}`);
  return (data?.rows ?? []) as ParsedTransaction[];
}

async function callDriveUpload(
  storagePath: string,
  filename: string,
  kind: ImportKind
): Promise<{ fileId: string; url: string } | null> {
  const { data, error } = await supabase.functions.invoke('drive-upload', {
    body: { path: storagePath, filename, kind },
  });
  if (error) return null;
  return data ?? null;
}

function labelFor(kind: ImportKind | ImportLog['source']): string {
  if (kind === 'DH_PDF') return 'DH (Delavska Hranilnica) PDF';
  if (kind === 'Revolut_PDF') return 'Revolut Business PDF';
  return 'CSV';
}

function descriptionFor(kind: ImportKind): string {
  if (kind === 'DH_PDF') return 'Slovenian bank statement, V breme / V dobro columns.';
  if (kind === 'Revolut_PDF') return 'Revolut Business statement, Money out / Money in columns.';
  return 'Custom CSV migration: date, description, funding_source, category, …';
}
