import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { monthName } from '../../../core/constants/months';
import { DashboardMonthlyExpense } from '../../../core/models/dashboard.model';

interface ChartBar {
  label: string;
  amount: number;
  heightPercentage: number;
}

@Component({
  selector: 'app-dashboard-monthly-chart',
  imports: [CurrencyPipe],
  templateUrl: './dashboard-monthly-chart.html',
  styleUrl: './dashboard-monthly-chart.scss',
})
export class DashboardMonthlyChart {
  history = input<DashboardMonthlyExpense[]>([]);
  loading = input(false);

  readonly bars = computed<ChartBar[]>(() => {
    const items = this.history();
    const max = Math.max(...items.map((item) => item.amount), 0);
    return items.map((item) => ({
      label: `${monthName(item.month).slice(0, 3)}/${String(item.year).slice(-2)}`,
      amount: item.amount,
      heightPercentage: max > 0 ? (item.amount / max) * 100 : 0,
    }));
  });
}
