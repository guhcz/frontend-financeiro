import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export interface MonthPeriod {
  month: number;
  year: number;
}

@Component({
  selector: 'app-month-switcher',
  imports: [LucideAngularModule],
  templateUrl: './month-switcher.html',
  styleUrl: './month-switcher.scss',
})
export class MonthSwitcher {
  month = input.required<number>();
  year = input.required<number>();

  periodChange = output<MonthPeriod>();

  readonly periodValue = computed(() => `${this.year()}-${pad2(this.month())}`);
  readonly periodLabel = computed(() => {
    const label = new Date(this.year(), this.month() - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  previous(): void {
    this.shift(-1);
  }

  next(): void {
    this.shift(1);
  }

  openPicker(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  }

  onPeriodInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      return;
    }
    const [year, month] = value.split('-').map(Number);
    this.periodChange.emit({ month, year });
  }

  private shift(delta: number): void {
    const date = new Date(this.year(), this.month() - 1 + delta, 1);
    this.periodChange.emit({ month: date.getMonth() + 1, year: date.getFullYear() });
  }
}
