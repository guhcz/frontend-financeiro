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
