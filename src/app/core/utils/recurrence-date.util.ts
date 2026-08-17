export function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function lastDayOfMonth(year: number, month: number): string {
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Default date to prefill a new expense/income with, for a given month/year: today's
 * day-of-month, clamped into that month (e.g. today the 31st, but the target month only has 30
 * days -> the 30th). Keeps a new record inside the period the user is currently viewing instead
 * of leaving the date blank and letting them accidentally save it into a different month.
 */
export function defaultDateInMonth(year: number, month: number): string {
  const today = new Date();
  const day = Math.min(today.getDate(), new Date(year, month, 0).getDate());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Adds (or subtracts) whole months to a year/month pair, rolling over into adjacent years as
 * needed (e.g. month 11 + 4 -> month 3 of the next year).
 */
export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12) + 1,
  };
}

/**
 * Splits a purchase's total price into N equal monthly installments (e.g. a phone bought for
 * R$5000 in 10x -> R$500.00/month). Rounds to cents; when the total doesn't divide evenly the
 * sum of installments can be off by a cent or two, which is an accepted simplification since
 * every installment is stored as the same fixed recurring amount.
 */
export function calculateInstallmentAmount(totalAmount: number, installments: number): number {
  return Math.round((totalAmount / installments) * 100) / 100;
}

/**
 * Last month/year covered by a purchase started at startMonth/startYear and split into N
 * installments (the Nth installment, since the start month counts as installment 1).
 */
export function lastInstallmentMonth(startYear: number, startMonth: number, installments: number): { year: number; month: number } {
  return addMonths(startYear, startMonth, installments - 1);
}
