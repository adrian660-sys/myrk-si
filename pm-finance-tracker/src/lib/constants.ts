import type { Category, FundingSource, BillStatus } from './types';

export const FUNDING_SOURCES: FundingSource[] = ['Cash', 'DH', 'Revolut'];
export const CATEGORIES: Category[] = ['Income', 'Business', 'Travel', 'Transfer'];
export const BILL_STATUSES: BillStatus[] = ['📎 Bill', '/', ''];

/** Subcategories per category. Transfer has none. */
export const SUBCATEGORIES: Record<Category, string[]> = {
  Income: ['Balance', 'Research Payment'],
  Business: ['Health Contribution', 'Social Contribution', 'Tax', 'Accounting', 'Banking'],
  Travel: ['Transport', 'Accommodation', 'Per Diem', 'Remote Work', 'Miscellaneous'],
  Transfer: [],
};

/** Fixed daily rates the app calculates automatically. */
export const PER_DIEM_RATE = 110;
export const REMOTE_WORK_RATE = 50;

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  '📎 Bill': 'Bill attached',
  '/': 'No bill needed',
  '': 'Missing',
};
