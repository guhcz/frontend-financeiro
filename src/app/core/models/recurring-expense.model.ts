import { Category } from './category.model';
import { PaymentMethod } from './payment-method.model';
import { RecurrenceFrequency } from './recurrence-frequency.model';

export type RecurrenceStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface RecurringExpense {
  id: number;
  category: Category;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  frequency: RecurrenceFrequency;
  dueDay: number;
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
  paymentMethod: PaymentMethod;
  notes: string | null;
  frequency: RecurrenceFrequency;
  dueDay: number;
  startDate: string;
  endDate: string | null;
}

export interface RecurringExpenseUpdateRequest {
  categoryId: number;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  dueDay: number;
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
