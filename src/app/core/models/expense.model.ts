import { Category } from './category.model';
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
}

export interface ExpenseRequest {
  categoryId: number;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
}

export interface ExpenseFilters {
  categoryId?: number;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  description?: string;
  page?: number;
  size?: number;
  sort?: string;
}
