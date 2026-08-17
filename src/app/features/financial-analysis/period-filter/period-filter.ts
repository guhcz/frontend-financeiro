import { Component, effect, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface PeriodRange {
  startDate: string;
  endDate: string;
}

export type PeriodShortcutKey = 'month' | '3m' | '6m' | '12m';

interface PeriodShortcut {
  key: PeriodShortcutKey;
  label: string;
  monthsBack: number;
}

const SHORTCUTS: PeriodShortcut[] = [
  { key: 'month', label: 'Este mês', monthsBack: 0 },
  { key: '3m', label: '3 meses', monthsBack: 2 },
  { key: '6m', label: '6 meses', monthsBack: 5 },
  { key: '12m', label: '12 meses', monthsBack: 11 },
];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Formats using local calendar fields (never toISOString/UTC), so the picked date never shifts a day. */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function shortcutRange(monthsBack: number): PeriodRange {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  return { startDate: formatLocalDate(start), endDate: formatLocalDate(today) };
}

@Component({
  selector: 'app-period-filter',
  imports: [LucideAngularModule],
  templateUrl: './period-filter.html',
  styleUrl: './period-filter.scss',
})
export class PeriodFilter {
  startDate = input.required<string>();
  endDate = input.required<string>();
  activeShortcut = input<PeriodShortcutKey | null>(null);

  applied = output<PeriodRange & { shortcut: PeriodShortcutKey | null }>();

  readonly shortcuts = SHORTCUTS;
  readonly draftStart = signal('');
  readonly draftEnd = signal('');
  readonly validationError = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.draftStart.set(this.startDate());
      this.draftEnd.set(this.endDate());
    });
  }

  onStartInput(event: Event): void {
    this.draftStart.set((event.target as HTMLInputElement).value);
  }

  onEndInput(event: Event): void {
    this.draftEnd.set((event.target as HTMLInputElement).value);
  }

  applyShortcut(shortcut: PeriodShortcut): void {
    const range = shortcutRange(shortcut.monthsBack);
    this.validationError.set(null);
    this.applied.emit({ ...range, shortcut: shortcut.key });
  }

  applyManual(): void {
    const start = this.draftStart();
    const end = this.draftEnd();
    if (!start || !end) {
      this.validationError.set('Selecione as duas datas do período.');
      return;
    }
    if (start > end) {
      this.validationError.set('Data inicial não pode ser depois da data final.');
      return;
    }
    this.validationError.set(null);
    this.applied.emit({ startDate: start, endDate: end, shortcut: null });
  }
}
