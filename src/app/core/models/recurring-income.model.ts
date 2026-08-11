import { Category } from './category.model';
import { ReceiptMethod } from './receipt-method.model';
import { RecurrenceFrequency } from './recurrence-frequency.model';
import { RecurrenceStatus } from './recurring-expense.model';

export interface RecurringIncome {
  id: number;
  category: Category;
  description: string;
  amount: number;
  receiptMethod: ReceiptMethod;
  notes: string | null;
  frequency: RecurrenceFrequency;
  receiptDay: number | null;
  startDate: string;
  endDate: string | null;
  nextGenerationDate: string | null;
  active: boolean;
  status: RecurrenceStatus;
}

export interface RecurringIncomeRequest {
  categoryId: number;
  description: string;
  amount: number;
  receiptMethod: ReceiptMethod;
  notes: string | null;
  frequency: RecurrenceFrequency;
  receiptDay: number | null;
  startDate: string;
  endDate: string | null;
}

export interface RecurringIncomeUpdateRequest {
  categoryId: number;
  description: string;
  amount: number;
  receiptMethod: ReceiptMethod;
  notes: string | null;
  receiptDay: number | null;
  endDate: string | null;
}

export interface RecurringIncomeFilters {
  active?: boolean;
  categoryId?: number;
  description?: string;
  page?: number;
  size?: number;
  sort?: string;
}
