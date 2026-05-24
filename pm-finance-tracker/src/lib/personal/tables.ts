/** PostgREST table names for personal finance (prefixed, separate from PM tables). */
export const PT = {
  categories: 'personal_categories',
  subcategories: 'personal_subcategories',
  funding_sources: 'personal_funding_sources',
  transactions: 'personal_transactions',
  planned_transactions: 'personal_planned_transactions',
} as const;

export const PERSONAL_CHANGED = 'pmf:personal-changed';

export function notifyPersonalChanged() {
  window.dispatchEvent(new Event(PERSONAL_CHANGED));
}
