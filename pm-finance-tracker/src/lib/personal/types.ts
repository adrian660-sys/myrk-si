export type PersonalCategoryType = 'expense' | 'income' | 'transfer';
export type PersonalPlannedFrequency = 'once' | 'monthly' | 'quarterly' | 'yearly';

export interface PersonalCategory {
  id: string;
  name: string;
  type: PersonalCategoryType;
  created_at: string;
}

export interface PersonalSubcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
}

export interface PersonalFundingSource {
  id: string;
  name: string;
  created_at: string;
}

export interface PersonalTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string;
  subcategory_id: string | null;
  funding_source_id: string;
  notes: string | null;
  import_source: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalPlannedTransaction {
  id: string;
  description: string;
  amount: number;
  category_id: string;
  subcategory_id: string | null;
  funding_source_id: string;
  frequency: PersonalPlannedFrequency;
  start_date: string;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalPlannedOccurrence {
  planned_id: string;
  description: string;
  amount: number;
  category_id: string;
  subcategory_id: string | null;
  funding_source_id: string;
  due_date: string;
}
