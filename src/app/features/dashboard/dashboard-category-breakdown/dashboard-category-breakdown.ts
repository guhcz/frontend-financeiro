import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CategoryExpense } from '../../../core/models/planning.model';

@Component({
  selector: 'app-dashboard-category-breakdown',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard-category-breakdown.html',
  styleUrl: './dashboard-category-breakdown.scss',
})
export class DashboardCategoryBreakdown {
  data = input<CategoryExpense[]>([]);
  loading = input(false);
}
