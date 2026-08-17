export function monthYearLabel(month: number, year: number): string {
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthShortLabel(month: number, year: number): string {
  const raw = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return `${capitalized}/${year}`;
}
