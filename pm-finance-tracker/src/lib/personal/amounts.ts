import type { PersonalCategory, PersonalCategoryType } from './types';

export function personalSignedAmount(
  raw: number,
  categoryType: PersonalCategoryType,
  signChoice: '+' | '-'
): number {
  const abs = Math.abs(raw);
  if (categoryType === 'income') return abs;
  if (categoryType === 'expense') return -abs;
  return signChoice === '+' ? abs : -abs;
}

export function personalAmountSignChoice(amount: number): '+' | '-' {
  return amount >= 0 ? '+' : '-';
}

export function personalCategoryTypeOf(
  categoryId: string,
  categories: PersonalCategory[]
): PersonalCategoryType {
  return categories.find((c) => c.id === categoryId)?.type ?? 'expense';
}
