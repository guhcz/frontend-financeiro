import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardRecentExpense } from '../../../core/models/dashboard.model';
import { Badge } from '../../../shared/badge/badge';
import { EmptyState } from '../../../shared/empty-state/empty-state';

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-dashboard-recent-expenses',
  imports: [CurrencyPipe, DatePipe, RouterLink, Badge, EmptyState],
  templateUrl: './dashboard-recent-expenses.html',
  styleUrl: './dashboard-recent-expenses.scss',
})
export class DashboardRecentExpenses {
  expenses = input<DashboardRecentExpense[]>([]);
  loading = input(false);

  registerFirst = output<void>();

  relativeDate(expenseDate: string): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (expenseDate === toDateOnly(today)) {
      return 'Hoje';
    }
    if (expenseDate === toDateOnly(yesterday)) {
      return 'Ontem';
    }
    return '';
  }
}
