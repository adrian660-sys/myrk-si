import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import TransactionForm from './TransactionForm';
import { supabase } from '../lib/supabase';
import { notifyPaymentsChanged } from '../hooks/useFinanceData';
import { formatDate, formatSigned, todayIso } from '../lib/format';
import type {
  Category, PlannedOccurrence, PlannedPayment, PlannedTransaction, Trip,
} from '../lib/types';

interface ParsedReceipt {
  amount: number | null;
  date: string | null;
  description: string | null;
  storagePath: string;
}

interface Props {
  occurrence: PlannedOccurrence | null;
  trips: Trip[];
  categories: Category[];
  subcategories: Record<string, string[]>;
  planned: PlannedTransaction[];
  plannedPayments: PlannedPayment[];
  onDone: () => void;
  onClose: () => void;
}

export default function MarkPaidModal({
  occurrence, trips, categories, subcategories, planned, plannedPayments, onDone, onClose,
}: Props) {
  const { t } = useTranslation();

  if (!occurrence) return null;

  return (
    <Modal open={!!occurrence} onClose={onClose} title={t('markPaid.title')}>
      <MarkPaidContent
        occurrence={occurrence}
        trips={trips}
        categories={categories}
        subcategories={subcategories}
        planned={planned}
        plannedPayments={plannedPayments}
        onDone={onDone}
      />
    </Modal>
  );
}

function MarkPaidContent({
  occurrence, trips, categories, subcategories, planned, plannedPayments, onDone,
}: Omit<Required<Props>, 'occurrence' | 'onClose'> & { occurrence: PlannedOccurrence }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [saving, setSaving] = useState(false);

  async function justMarkPaid() {
    setSaving(true);
    const { error } = await supabase.from('planned_payments').insert({
      planned_id: occurrence.planned_id,
      due_date: occurrence.due_date,
      paid_on: todayIso(),
      transaction_id: null,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    notifyPaymentsChanged();
    onDone();
  }

  if (step === 'choose') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-canvas p-4 text-sm space-y-1">
          <div className="font-medium text-base">{occurrence.description}</div>
          <div className="text-muted">
            {t('dashboard.due')}: <span className="text-expense font-medium">{formatDate(occurrence.due_date)}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums text-expense">{formatSigned(occurrence.amount)}</span>
            <span className="mx-2">·</span>
            {occurrence.funding_source}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn-secondary flex flex-col items-center gap-1 py-4"
            onClick={justMarkPaid}
            disabled={saving}
          >
            <span className="text-lg">✓</span>
            <span className="font-medium text-sm">{t('markPaid.justMarkPaid')}</span>
            <span className="text-xs text-muted text-center">{t('markPaid.justMarkPaidHint')}</span>
          </button>
          <button
            type="button"
            className="btn-primary flex flex-col items-center gap-1 py-4"
            onClick={() => setStep('form')}
          >
            <span className="text-lg">📄</span>
            <span className="font-medium text-sm">{t('markPaid.logTransaction')}</span>
            <span className="text-xs text-white/70 text-center">{t('markPaid.logTransactionHint')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormStep
      occurrence={occurrence}
      trips={trips}
      categories={categories}
      subcategories={subcategories}
      planned={planned}
      plannedPayments={plannedPayments}
      onDone={onDone}
      onBack={() => setStep('choose')}
    />
  );
}

function FormStep({
  occurrence, trips, categories, subcategories, planned, plannedPayments, onDone, onBack,
}: {
  occurrence: PlannedOccurrence;
  trips: Trip[];
  categories: Category[];
  subcategories: Record<string, string[]>;
  planned: PlannedTransaction[];
  plannedPayments: PlannedPayment[];
  onDone: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setParseError(t('markPaid.unsupportedFile'));
      return;
    }

    setParsing(true);
    setParseError(null);
    setParsed(null);

    try {
      // Upload to receipts bucket
      const ext = file.name.split('.').pop() ?? 'bin';
      const storagePath = `${occurrence.planned_id}/${occurrence.due_date}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('receipts').upload(storagePath, file, { upsert: true });
      if (uploadErr) throw new Error(uploadErr.message);

      // Convert to base64 for edge function
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Call parse-receipt edge function
      const { data, error: fnErr } = await supabase.functions.invoke('parse-receipt', {
        body: { fileBase64: base64, mediaType: file.type, storagePath },
      });
      if (fnErr) throw new Error(fnErr.message);

      setParsed({ ...data, storagePath });
    } catch (e) {
      setParseError((e as Error).message);
    } finally {
      setParsing(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Pre-fill values: planned item as base, receipt overrides if available
  const preFill = {
    description: parsed?.description ?? occurrence.description,
    amountStr: parsed?.amount != null
      ? String(Math.abs(parsed.amount))
      : String(Math.abs(occurrence.amount)),
    direction: 'out' as const,
    category: occurrence.category,
    subcategory: occurrence.subcategory ?? undefined,
    fundingSource: occurrence.funding_source,
    date: parsed?.date ?? todayIso(),
    receiptPath: parsed?.storagePath,
  };

  const preLinked = {
    planned_id: occurrence.planned_id,
    due_date: occurrence.due_date,
    description: occurrence.description,
  };

  return (
    <div className="space-y-4">
      {/* Receipt upload */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted mb-2">
          {t('markPaid.receiptOptional')}
        </div>

        {!parsed && (
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-line hover:border-blue-300'
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {parsing ? (
              <div className="text-sm text-muted">{t('markPaid.parsing')}</div>
            ) : (
              <>
                <div className="text-2xl mb-1">📎</div>
                <div className="text-sm text-muted">{t('markPaid.dropHint')}</div>
                <div className="text-xs text-muted mt-1">JPG · PNG · WebP · PDF</div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {parsed && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-emerald-800">
              ✓ {t('markPaid.parsedReceipt')}
              {parsed.description && <span className="font-medium"> · {parsed.description}</span>}
              {parsed.amount && <span> · −€{parsed.amount.toFixed(2)}</span>}
              {parsed.date && <span> · {formatDate(parsed.date)}</span>}
            </span>
            <button type="button" className="text-xs text-emerald-600 hover:text-emerald-800"
              onClick={() => { setParsed(null); if (fileRef.current) fileRef.current.value = ''; }}>
              {t('common.cancel')}
            </button>
          </div>
        )}

        {parseError && (
          <div className="text-sm text-expense mt-1">{parseError}</div>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <TransactionForm
          trips={trips}
          categories={categories}
          subcategories={subcategories}
          planned={planned}
          plannedPayments={plannedPayments}
          preFill={preFill}
          preLinkedOccurrence={preLinked}
          onSaved={onDone}
          onCancel={onBack}
        />
      </div>
    </div>
  );
}
