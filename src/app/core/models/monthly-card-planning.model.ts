import { TransactionMethod } from './transaction-method.model';

export interface MonthlyCardPlanningItem {
  id: number;
  transactionMethod: TransactionMethod;
  plannedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface MonthlyCardPlanning {
  id: number;
  transactionMethod: TransactionMethod;
  month: number;
  year: number;
  amount: number;
  active: boolean;
}

export interface MonthlyCardPlanningRequest {
  transactionMethodId: number;
  month: number;
  year: number;
  amount: number;
}

export interface MonthlyCardPlanningFilters {
  month: number;
  year: number;
  page?: number;
  size?: number;
  sort?: string;
}
