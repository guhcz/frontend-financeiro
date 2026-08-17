import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { IncomeVsExpensesPoint } from '../../../core/models/financial-analysis.model';
import { monthShortLabel, monthYearLabel } from '../../../core/utils/month-label.util';

interface ChartGroup {
  month: number;
  year: number;
  label: string;
  fullLabel: string;
  incomeAmount: number;
  expenseAmount: number;
  balance: number;
  incomeHeightPct: number;
  expenseHeightPct: number;
  showLabel: boolean;
}

const MAX_VISIBLE_LABELS = 6;

@Component({
  selector: 'app-income-expense-chart',
  imports: [CurrencyPipe],
  templateUrl: './income-expense-chart.html',
  styleUrl: './income-expense-chart.scss',
})
export class IncomeExpenseChart {
  data = input.required<IncomeVsExpensesPoint[]>();
  loading = input(false);
  period = input<'monthly' | 'yearly'>('monthly');

  readonly hoveredIndex = signal<number | null>(null);

  readonly maxAmount = computed(() =>
    Math.max(...this.groupedData().flatMap((item) => [item.incomeAmount, item.expenseAmount]), 1),
  );

  readonly yTicks = computed(() => {
    const max = this.maxAmount();
    return [1, 0.75, 0.5, 0.25, 0].map((ratio) => max * ratio);
  });

  private readonly sorted = computed(() => [...this.data()].sort((a, b) => a.year - b.year || a.month - b.month));

  private readonly groupedData = computed(() => {
    const items = this.sorted();
    if (this.period() === 'monthly') return items;

    const byYear = new Map<number, IncomeVsExpensesPoint>();
    for (const item of items) {
      const current = byYear.get(item.year) ?? {
        month: 0,
        year: item.year,
        incomeAmount: 0,
        expenseAmount: 0,
      };
      current.incomeAmount += item.incomeAmount;
      current.expenseAmount += item.expenseAmount;
      byYear.set(item.year, current);
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  });

  readonly groups = computed<ChartGroup[]>(() => {
    const items = this.groupedData();
    const max = this.maxAmount();
    const labelStep = Math.max(1, Math.ceil(items.length / MAX_VISIBLE_LABELS));
    return items.map((item, i) => ({
      month: item.month,
      year: item.year,
      label: this.period() === 'yearly' ? String(item.year) : monthShortLabel(item.month, item.year),
      fullLabel: this.period() === 'yearly' ? String(item.year) : monthYearLabel(item.month, item.year),
      incomeAmount: item.incomeAmount,
      expenseAmount: item.expenseAmount,
      balance: item.incomeAmount - item.expenseAmount,
      incomeHeightPct: (item.incomeAmount / max) * 100,
      expenseHeightPct: (item.expenseAmount / max) * 100,
      showLabel: i % labelStep === 0 || i === items.length - 1,
    }));
  });

  readonly hoveredGroup = computed(() => {
    const index = this.hoveredIndex();
    return index === null ? null : this.groups()[index];
  });

  readonly hasData = computed(() => this.groups().some((g) => g.incomeAmount > 0 || g.expenseAmount > 0));
}
