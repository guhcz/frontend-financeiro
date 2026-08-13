import { Category } from './category.model';
import { CreditCard } from './credit-card.model';
import { PaymentMethod } from './payment-method.model';

export interface Expense {
  id: number;
  category: Category;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  active: boolean;
  generatedAutomatically: boolean;
  recurring: boolean;
  recurringExpenseId: number | null;
  creditCard: CreditCard | null;
  billingMonth: number;
  billingYear: number;
}

export interface ExpenseRequest {
  categoryId: number;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  creditCardId: number | null;
}

export interface ExpenseFilters {
  categoryId?: number;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  description?: string;
  recurring?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
