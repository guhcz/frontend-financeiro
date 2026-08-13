export interface MonthPeriod {
  month: number;
  year: number;
}

/**
 * The period screens (Movimentações, Planejamento, Despesas Fixas, Dashboard) default to open
 * one month ahead of today, not the current month: most credit card purchases made this month
 * are only billed next month, so the invoice/competence the user actually needs to plan for
 * right now is next month's.
 */
export function defaultPeriod(referenceDate: Date = new Date()): MonthPeriod {
  const next = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}
