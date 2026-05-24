import { useEffect, useState } from 'react';
import { useFinanceData } from '../hooks/useFinanceData';
import { useIsAdmin } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Trip } from '../lib/types';
import Modal from './Modal';
import TransactionForm from './TransactionForm';

export default function QuickEntryButton() {
  const isAdmin = useIsAdmin();
  const { categories, subcategories } = useFinanceData();
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('trips')
      .select('*')
      .order('end_date', { ascending: false })
      .then(({ data }) => setTrips((data as Trip[]) ?? []));
  }, [open]);

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full bg-ink text-white text-2xl shadow-lg hover:bg-black"
        aria-label="Quick add transaction"
      >
        +
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Quick entry">
        <TransactionForm
          trips={trips}
          categories={categories}
          subcategories={subcategories}
          onSaved={() => {
            setOpen(false);
            window.dispatchEvent(new CustomEvent('pmf:transactions-changed'));
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
