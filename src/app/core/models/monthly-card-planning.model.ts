import { CreditCard } from './credit-card.model';

export interface MonthlyCardPlanningItem {
  id: number;
  creditCard: CreditCard;
  plannedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface MonthlyCardPlanning {
  id: number;
  creditCard: CreditCard;
  month: number;
  year: number;
  amount: number;
  active: boolean;
}

export interface MonthlyCardPlanningRequest {
  creditCardId: number;
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
