import { Category } from './category.model';
import { CardTransactionMode, TransactionMethod } from './transaction-method.model';

export interface Expense {
  id: number;
  category: Category;
  description: string;
  amount: number;
  expenseDate: string;
  transactionMethod: TransactionMethod;
  cardTransactionMode: CardTransactionMode | null;
  notes: string | null;
  active: boolean;
  generatedAutomatically: boolean;
  recurring: boolean;
  recurringExpenseId: number | null;
  billingMonth: number;
  billingYear: number;
}

export interface ExpenseRequest {
  categoryId: number;
  description: string;
  amount: number;
  expenseDate: string;
  transactionMethodId: number;
  cardTransactionMode: CardTransactionMode | null;
  notes: string | null;
}

export interface ExpenseFilters {
  categoryId?: number;
  transactionMethodId?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  recurring?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
