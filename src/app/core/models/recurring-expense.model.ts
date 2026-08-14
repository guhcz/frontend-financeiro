import { Category } from './category.model';
import { RecurrenceFrequency } from './recurrence-frequency.model';
import { CardTransactionMode, TransactionMethod } from './transaction-method.model';

export type RecurrenceStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface RecurringExpense {
  id: number;
  category: Category;
  description: string;
  amount: number;
  transactionMethod: TransactionMethod;
  cardTransactionMode: CardTransactionMode | null;
  notes: string | null;
  frequency: RecurrenceFrequency;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
  nextGenerationDate: string | null;
  active: boolean;
  status: RecurrenceStatus;
}

export interface RecurringExpenseRequest {
  categoryId: number;
  description: string;
  amount: number;
  transactionMethodId: number;
  cardTransactionMode: CardTransactionMode | null;
  notes: string | null;
  frequency: RecurrenceFrequency;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
}

export interface RecurringExpenseUpdateRequest {
  categoryId: number;
  description: string;
  amount: number;
  transactionMethodId: number;
  cardTransactionMode: CardTransactionMode | null;
  notes: string | null;
  dueDay: number | null;
  endDate: string | null;
}

export interface RecurringExpenseFilters {
  active?: boolean;
  categoryId?: number;
  description?: string;
  page?: number;
  size?: number;
  sort?: string;
}
