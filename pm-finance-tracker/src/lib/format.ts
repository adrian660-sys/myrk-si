const eur = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEur(amount: number): string {
  return eur.format(amount);
}

/** Signed currency, e.g. "+2 400,00 €" / "-215,00 €". */
export function formatSigned(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return sign + eur.format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function monthKey(date: string): string {
  return date.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string): string {
  return new Date(key + '-01T00:00:00').toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
