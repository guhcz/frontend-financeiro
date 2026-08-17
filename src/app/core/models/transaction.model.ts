import { Category } from './category.model';

export type TransactionType = 'EXPENSE' | 'INCOME';

export interface TransactionListItem {
  id: number;
  transactionKey?: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  method: string;
  cardTransactionMode: 'CREDIT' | 'DEBIT' | null;
  recurring: boolean;
  generatedAutomatically: boolean;
  notes?: string | null;
  category: Category;
  billingMonth?: number | null;
  billingYear?: number | null;
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  description?: string;
  recurring?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
