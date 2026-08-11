import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardSummary } from '../../../core/models/dashboard.model';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

@Component({
  selector: 'app-dashboard-summary-cards',
  imports: [CurrencyPipe, ProgressBar, LucideAngularModule],
  templateUrl: './dashboard-summary-cards.html',
  styleUrl: './dashboard-summary-cards.scss',
})
export class DashboardSummaryCards {
  summary = input<DashboardSummary | null>(null);
  activeRecurringCount = input<number | null>(null);
  loading = input(false);

  defineLimit = output<void>();

  readonly hasLimit = computed(() => this.summary()?.monthlyLimit != null);

  readonly availableState = computed<'good' | 'warning' | 'danger'>(() => {
    const pct = this.summary()?.limitPercentageUsed;
    if (pct == null) return 'good';
    if (pct > 100) return 'danger';
    if (pct >= 80) return 'warning';
    return 'good';
  });
}
