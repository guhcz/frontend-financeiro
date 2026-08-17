import { Category } from './category.model';
import { CardTransactionMode, TransactionMethodType } from './transaction-method.model';

export interface IncomeVsExpensesPoint {
  month: number;
  year: number;
  incomeAmount: number;
  expenseAmount: number;
}

export interface ExpenseByCategory {
  category: Category;
  amount: number;
  percentage: number;
}

export interface PaymentMethodExpense {
  transactionMethodId: number;
  name: string;
  methodType: TransactionMethodType;
  cardMode: CardTransactionMode | null;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyBalancePoint {
  month: number;
  year: number;
  incomeAmount: number;
  expenseAmount: number;
  balance: number;
}

export interface LargestExpense {
  id: number;
  description: string;
  category: Category;
  transactionMethod: { id: number; name: string; type: string };
  cardMode: CardTransactionMode | null;
  date: string;
  billingMonth: number;
  billingYear: number;
  amount: number;
}

export interface FinancialAnalysisResponse {
  startDate: string;
  endDate: string;
  incomeVsExpenses: IncomeVsExpensesPoint[];
  expensesByCategory: ExpenseByCategory[];
  expensesByPaymentMethod: PaymentMethodExpense[];
  monthlyBalanceEvolution: MonthlyBalancePoint[];
  largestExpenses: LargestExpense[];
}

export interface PaymentMethodAnalysisItem {
  transactionMethodId: number;
  name: string;
  methodType: TransactionMethodType;
  cardMode: CardTransactionMode | null;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface PaymentMethodAnalysisPage {
  content: PaymentMethodAnalysisItem[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  totalAmount: number;
  totalTransactionCount: number;
}

export interface PaymentMethodAnalysisFilters {
  startDate: string;
  endDate: string;
  search?: string;
  type?: TransactionMethodType;
  sort?: string;
  page?: number;
  size?: number;
}
