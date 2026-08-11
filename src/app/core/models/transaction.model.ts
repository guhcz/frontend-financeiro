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
  recurring: boolean;
  generatedAutomatically: boolean;
  notes?: string | null;
  category: Category;
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  recurring?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
