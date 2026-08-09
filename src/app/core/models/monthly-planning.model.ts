import { Category } from './category.model';

export interface MonthlyPlanningItem {
  id: number;
  category: Category;
  plannedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface MonthlyPlanning {
  id: number;
  category: Category;
  month: number;
  year: number;
  amount: number;
  active: boolean;
}

export interface MonthlyPlanningRequest {
  categoryId: number;
  month: number;
  year: number;
  amount: number;
}

export interface MonthlyPlanningFilters {
  month: number;
  year: number;
  page?: number;
  size?: number;
  sort?: string;
}
