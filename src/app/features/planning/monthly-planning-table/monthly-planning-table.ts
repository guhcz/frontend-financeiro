import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MonthlyPlanningItem } from '../../../core/models/monthly-planning.model';
import { Page } from '../../../core/models/page.model';
import { Badge } from '../../../shared/badge/badge';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Pagination } from '../../../shared/pagination/pagination';
import { ProgressBar } from '../../../shared/progress-bar/progress-bar';

const COLLAPSED_KEY = 'planning-category-table-collapsed';

@Component({
  selector: 'app-monthly-planning-table',
  imports: [CurrencyPipe, DecimalPipe, Badge, ProgressBar, Pagination, EmptyState, LucideAngularModule],
  templateUrl: './monthly-planning-table.html',
  styleUrl: './monthly-planning-table.scss',
})
export class MonthlyPlanningTable {
  page = input<Page<MonthlyPlanningItem> | null>(null);
  totalPlanned = input<number | null>(null);
  unplannedAmount = input<number | null>(null);
  loading = input(false);
  error = input<string | null>(null);

  add = output<void>();
  edit = output<MonthlyPlanningItem>();
  delete = output<MonthlyPlanningItem>();
  pageChange = output<number>();
  sizeChange = output<number>();

  readonly collapsed = signal(localStorage.getItem(COLLAPSED_KEY) === 'true');

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    localStorage.setItem(COLLAPSED_KEY, String(this.collapsed()));
  }

  remainingState(item: MonthlyPlanningItem): 'good' | 'warning' | 'danger' {
    const pct = item.percentageUsed;
    if (pct > 100) return 'danger';
    if (pct >= 80) return 'warning';
    return 'good';
  }
}
