export const MONTH_NAMES: string[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}
