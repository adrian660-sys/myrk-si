export type FundingSource = 'Cash' | 'DH' | 'Revolut';
export type Category = 'Income' | 'Business' | 'Travel' | 'Transfer';
export type BillStatus = '📎 Bill' | '/' | '';
export type ImportSource = 'DH_PDF' | 'Revolut_PDF' | 'CSV' | 'manual';
export type Role = 'admin' | 'guest';

export interface Trip {
  id: string;
  name: string;
  city: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  date: string | null;
  description: string;
  funding_source: FundingSource;
  category: Category;
  subcategory: string | null;
  amount: number;
  notes: string | null;
  bill_status: BillStatus;
  trip_id: string | null;
  import_source: ImportSource | null;
  import_batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashReceived {
  id: string;
  trip_id: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface ImportLog {
  id: string;
  source: 'DH_PDF' | 'Revolut_PDF' | 'CSV';
  filename: string | null;
  rows_imported: number;
  rows_skipped: number;
  supabase_storage_path: string | null;
  google_drive_file_id: string | null;
  google_drive_url: string | null;
  uploaded_by: string | null;
  created_at: string;
}

/** A transaction shape used on the import review screen before it is saved. */
export interface ParsedTransaction {
  date: string | null;
  description: string;
  funding_source: FundingSource;
  category: Category;
  subcategory: string | null;
  amount: number;
  notes: string | null;
  bill_status: BillStatus;
  trip_id: string | null;
  /** true when the parser could not confidently categorise the row. */
  needsReview: boolean;
  /** true when an identical transaction already exists in the database. */
  duplicate: boolean;
}
