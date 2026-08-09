import { Category } from './category.model';

export interface PlanningSummary {
  month: number;
  year: number;
  monthlyLimit: number | null;
  totalSpent: number;
  availableAmount: number | null;
  percentageUsed: number | null;
  totalPlanned: number;
  unplannedAmount: number | null;
}

export interface CategoryExpense {
  category: Category;
  amount: number;
  percentage: number;
}

export interface ExpenseEvolutionPoint {
  date: string;
  dailyAmount: number;
  accumulatedAmount: number;
}
