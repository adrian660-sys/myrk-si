import type {
  PersonalCategory,
  PersonalFundingSource,
  PersonalSubcategory,
} from './types';

export function personalCategoryById(
  id: string,
  categories: PersonalCategory[]
): PersonalCategory | undefined {
  return categories.find((c) => c.id === id);
}

export function personalCategoryName(id: string, categories: PersonalCategory[]): string {
  return personalCategoryById(id, categories)?.name ?? '—';
}

export function personalSubcategoryName(
  id: string | null,
  subcategories: PersonalSubcategory[]
): string {
  if (!id) return '—';
  return subcategories.find((s) => s.id === id)?.name ?? '—';
}

export function personalFundingSourceName(
  id: string,
  sources: PersonalFundingSource[]
): string {
  return sources.find((s) => s.id === id)?.name ?? '—';
}

export function personalSubcategoriesForCategory(
  categoryId: string,
  subcategories: PersonalSubcategory[]
): PersonalSubcategory[] {
  return subcategories
    .filter((s) => s.category_id === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
