import { Category } from './category.model';
import { CategoryExpense } from './planning.model';
import { PaymentMethod } from './payment-method.model';

export interface DashboardSummary {
  totalIncome: number | null;
  totalExpenses: number;
  balance: number | null;
  monthlyLimit: number | null;
  availableAmount: number | null;
  limitPercentageUsed: number | null;
}

export interface DashboardRecentExpense {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: PaymentMethod;
  recurring: boolean;
  category: Category;
}

export interface DashboardMonthlyExpense {
  month: number;
  year: number;
  amount: number;
}

export interface DashboardRecurringSummary {
  activeCount: number;
  dueInNext7DaysCount: number;
  dueTodayAmount: number;
}

export type DashboardFinancialStatusType = 'NO_LIMIT' | 'WITHIN_LIMIT' | 'ATTENTION' | 'LIMIT_REACHED' | 'OVER_LIMIT';

export interface DashboardFinancialStatus {
  type: DashboardFinancialStatusType;
  message: string;
}

export interface DashboardResponse {
  month: number;
  year: number;
  summary: DashboardSummary;
  recentExpenses: DashboardRecentExpense[];
  expensesByCategory: CategoryExpense[];
  monthlyExpenseHistory: DashboardMonthlyExpense[];
  recurringExpensesSummary: DashboardRecurringSummary;
  averageDailyExpense: number;
  financialStatus: DashboardFinancialStatus;
}
