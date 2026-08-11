import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardFinancialStatus, DashboardSummary } from '../../../core/models/dashboard.model';

const RADIUS = 72;
const STROKE_WIDTH = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-dashboard-overview',
  imports: [CurrencyPipe, DecimalPipe, LucideAngularModule],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.scss',
})
export class DashboardOverview {
  summary = input<DashboardSummary | null>(null);
  financialStatus = input<DashboardFinancialStatus | null>(null);
  loading = input(false);

  readonly radius = RADIUS;
  readonly strokeWidth = STROKE_WIDTH;
  readonly circumference = CIRCUMFERENCE;

  readonly hasLimit = computed(() => this.summary()?.monthlyLimit != null);

  readonly percentage = computed(() => this.summary()?.limitPercentageUsed ?? 0);

  readonly arcLength = computed(() => {
    const clamped = Math.min(Math.max(this.percentage(), 0), 100);
    return (clamped / 100) * this.circumference;
  });

  readonly statusClass = computed(() => {
    switch (this.financialStatus()?.type) {
      case 'WITHIN_LIMIT':
        return 'status-success';
      case 'ATTENTION':
        return 'status-warning';
      case 'LIMIT_REACHED':
      case 'OVER_LIMIT':
        return 'status-danger';
      default:
        return 'status-info';
    }
  });
}
