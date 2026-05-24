import type { Category } from './types';
import { CATEGORIES, SUBCATEGORIES } from './constants';

export interface PmCategoryRow {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface PmSubcategoryRow {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export function buildCategoryLists(
  categories: PmCategoryRow[],
  subcategories: PmSubcategoryRow[]
): { categories: Category[]; subcategories: Record<string, string[]> } {
  if (categories.length === 0) {
    return { categories: [...CATEGORIES], subcategories: { ...SUBCATEGORIES } };
  }
  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const catNames = sorted.map((c) => c.name) as Category[];
  const map: Record<string, string[]> = {};
  for (const c of sorted) {
    map[c.name] = subcategories
      .filter((s) => s.category_id === c.id)
      .map((s) => s.name)
      .sort((a, b) => a.localeCompare(b));
  }
  return { categories: catNames, subcategories: map };
}

/** Map import synonyms onto names from the live catalog. */
export function canoniseCategoryName(raw: string, validNames: string[]): string | null {
  const k = raw.trim().toLowerCase();
  if (!k) return null;
  const exact = validNames.find((n) => n.toLowerCase() === k);
  if (exact) return exact;
  if (k.startsWith('income')) return validNames.find((n) => n.toLowerCase() === 'income') ?? null;
  if (k.startsWith('business')) return validNames.find((n) => n.toLowerCase() === 'business') ?? null;
  if (k.startsWith('travel')) return validNames.find((n) => n.toLowerCase() === 'travel') ?? null;
  if (k.startsWith('transfer')) return validNames.find((n) => n.toLowerCase() === 'transfer') ?? null;
  if (k === 'other expenses' || k === 'other') {
    return validNames.find((n) => n.toLowerCase() === 'travel') ?? null;
  }
  return null;
}
