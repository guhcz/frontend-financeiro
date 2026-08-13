import { Category } from './category.model';
import { CreditCard } from './credit-card.model';
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
  creditCard: CreditCard | null;
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
  paymentMethod: PaymentMethod;
  notes: string | null;
  creditCardId: number | null;
  frequency: RecurrenceFrequency;
  dueDay: number | null;
  startDate: string;
  endDate: string | null;
}

export interface RecurringExpenseUpdateRequest {
  categoryId: number;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  creditCardId: number | null;
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
