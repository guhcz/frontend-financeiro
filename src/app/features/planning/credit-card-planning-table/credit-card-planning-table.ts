import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MonthlyCardPlanningItem } from '../../../core/models/monthly-card-planning.model';
import { Page } from '../../../core/models/page.model';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Pagination } from '../../../shared/pagination/pagination';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

const COLLAPSED_KEY = 'planning-card-table-collapsed';

@Component({
  selector: 'app-credit-card-planning-table',
  imports: [CurrencyPipe, DecimalPipe, ProgressBar, Pagination, EmptyState, LucideAngularModule, RouterLink],
  templateUrl: './credit-card-planning-table.html',
  styleUrl: './credit-card-planning-table.scss',
})
export class CreditCardPlanningTable {
  page = input<Page<MonthlyCardPlanningItem> | null>(null);
  totalPlanned = input<number | null>(null);
  loading = input(false);
  error = input<string | null>(null);

  add = output<void>();
  edit = output<MonthlyCardPlanningItem>();
  delete = output<MonthlyCardPlanningItem>();
  pageChange = output<number>();
  sizeChange = output<number>();

  readonly collapsed = signal(localStorage.getItem(COLLAPSED_KEY) === 'true');

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    localStorage.setItem(COLLAPSED_KEY, String(this.collapsed()));
  }

  remainingState(item: MonthlyCardPlanningItem): 'good' | 'warning' | 'danger' {
    const pct = item.percentageUsed;
    if (pct > 100) return 'danger';
    if (pct >= 80) return 'warning';
    return 'good';
  }
}
