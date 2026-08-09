import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CategoryExpense } from '../../../core/models/planning.model';

const RADIUS = 80;
const STROKE_WIDTH = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 3;
const MAX_SEGMENTS = 6;
const OTHER_COLOR = '#9ca3af';

interface DonutSegment {
  name: string;
  color: string;
  amount: number;
  percentage: number;
  length: number;
  offsetLength: number;
}

@Component({
  selector: 'app-expenses-by-category-chart',
  imports: [CurrencyPipe, DecimalPipe, LucideAngularModule],
  templateUrl: './expenses-by-category-chart.html',
  styleUrl: './expenses-by-category-chart.scss',
})
export class ExpensesByCategoryChart {
  data = input.required<CategoryExpense[]>();
  totalSpent = input.required<number>();
  loading = input(false);
  error = input<string | null>(null);

  readonly radius = RADIUS;
  readonly strokeWidth = STROKE_WIDTH;
  readonly circumference = CIRCUMFERENCE;

  private readonly grouped = computed(() => {
    const items = this.data();
    if (items.length <= MAX_SEGMENTS) {
      return items.map((item) => ({
        name: item.category.name,
        color: item.category.color,
        amount: item.amount,
        percentage: item.percentage,
      }));
    }
    const top = items.slice(0, MAX_SEGMENTS - 1);
    const rest = items.slice(MAX_SEGMENTS - 1);
    const restAmount = rest.reduce((sum, item) => sum + item.amount, 0);
    const restPercentage = rest.reduce((sum, item) => sum + item.percentage, 0);
    return [
      ...top.map((item) => ({
        name: item.category.name,
        color: item.category.color,
        amount: item.amount,
        percentage: item.percentage,
      })),
      { name: 'Outras', color: OTHER_COLOR, amount: restAmount, percentage: restPercentage },
    ];
  });

  readonly segments = computed<DonutSegment[]>(() => {
    const items = this.grouped();
    const total = items.reduce((sum, item) => sum + item.amount, 0) || 1;
    let cumulative = 0;
    return items.map((item) => {
      const fraction = item.amount / total;
      const length = Math.max(fraction * this.circumference - SEGMENT_GAP, 0);
      const offsetLength = cumulative * this.circumference;
      cumulative += fraction;
      return { ...item, length, offsetLength };
    });
  });
}
