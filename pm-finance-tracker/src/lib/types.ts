export type FundingSource = 'Cash' | 'DH' | 'Revolut';
export type Category = 'Income' | 'Business' | 'Travel' | 'Transfer';
export type IncomeFundingSource = 'DH' | 'Revolut';

export interface IncomeRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  funding_source: IncomeFundingSource;
  notes: string | null;
  created_at: string;
}
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
  funding_source: FundingSource;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface ProjectReceipt {
  id: string;
  project_id: string;
  date: string;
  amount: number;
  funding_source: FundingSource;
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
  import_batch_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export type PlannedFrequency = 'once' | 'monthly' | 'quarterly' | 'yearly';

export interface PlannedTransaction {
  id: string;
  description: string;
  funding_source: FundingSource;
  category: Category;
  subcategory: string | null;
  amount: number;
  frequency: PlannedFrequency;
  start_date: string;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A single virtual occurrence generated from a PlannedTransaction. */
export interface PlannedOccurrence {
  planned_id: string;
  description: string;
  funding_source: FundingSource;
  category: Category;
  subcategory: string | null;
  amount: number;
  due_date: string; // YYYY-MM-DD
}

export interface PlannedPayment {
  id: string;
  planned_id: string;
  due_date: string;
  paid_on: string;
  transaction_id: string | null;
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
  /**
   * Whether this row is queued for import. Default: matched rows -> true,
   * needsReview / duplicate -> false. Users can flip it in the review UI.
   */
  include: boolean;
}

// ─── Invoicing ────────────────────────────────────────────────────────────

export interface BusinessSettings {
  id: number;
  legal_name: string;
  display_name: string;
  address_line1: string;
  address_line2: string | null;
  postal_code: string;
  city: string;
  country: string;
  tax_id: string;
  registration_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  vat_notice: string;
  place_of_issue: string;
  default_due_days: number;
  default_bank_account_id: string | null;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  name: string;
  iban: string;
  bic: string | null;
  bank_name: string | null;
  bank_address: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  is_company: boolean;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  tax_id: string | null;
  registration_id: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export type InvoiceType = 'invoice' | 'proforma';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  type: InvoiceType;
  invoice_number: string;
  sequence_year: number;
  sequence_in_year: number;
  client_id: string;
  bank_account_id: string;
  issue_date: string;
  service_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_total: number;
  total: number;
  reference_number: string | null;
  place_of_issue: string;
  vat_notice: string | null;
  notes: string | null;
  paid_on: string | null;
  transaction_id: string | null;
  project_receipt_id: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  discount_pct: number;
  total: number;
  created_at: string;
}
