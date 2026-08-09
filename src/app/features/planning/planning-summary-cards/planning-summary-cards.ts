import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PlanningSummary } from '../../../core/models/planning.model';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

@Component({
  selector: 'app-planning-summary-cards',
  imports: [CurrencyPipe, DecimalPipe, ProgressBar, LucideAngularModule],
  templateUrl: './planning-summary-cards.html',
  styleUrl: './planning-summary-cards.scss',
})
export class PlanningSummaryCards {
  summary = input<PlanningSummary | null>(null);
  loading = input(false);

  editLimit = output<void>();

  readonly hasLimit = computed(() => this.summary()?.monthlyLimit != null);

  readonly availableState = computed<'good' | 'warning' | 'danger'>(() => {
    const pct = this.summary()?.percentageUsed;
    if (pct == null) return 'good';
    if (pct > 100) return 'danger';
    if (pct >= 80) return 'warning';
    return 'good';
  });
}
