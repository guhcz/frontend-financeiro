import { Category } from './category.model';
import { ReceiptMethod } from './receipt-method.model';

export interface Income {
  id: number;
  category: Category;
  description: string;
  amount: number;
  incomeDate: string;
  receiptMethod: ReceiptMethod;
  notes: string | null;
  active: boolean;
  generatedAutomatically: boolean;
  recurring: boolean;
  recurringIncomeId: number | null;
}

export interface IncomeRequest {
  categoryId: number;
  description: string;
  amount: number;
  incomeDate: string;
  receiptMethod: ReceiptMethod;
  notes: string | null;
}

export interface IncomeFilters {
  categoryId?: number;
  receiptMethod?: ReceiptMethod;
  startDate?: string;
  endDate?: string;
  description?: string;
  recurring?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
