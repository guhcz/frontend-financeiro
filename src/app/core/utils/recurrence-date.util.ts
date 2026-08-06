export function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function lastDayOfMonth(year: number, month: number): string {
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
