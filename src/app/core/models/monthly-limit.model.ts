export interface MonthlyLimit {
  id: number;
  month: number;
  year: number;
  amount: number;
  active: boolean;
}

export interface MonthlyLimitRequest {
  month: number;
  year: number;
  amount: number;
}
