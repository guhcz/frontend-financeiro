import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models/category.model';
import { DashboardResponse } from '../../../core/models/dashboard.model';
import { Expense, ExpenseRequest } from '../../../core/models/expense.model';
import { MonthlyLimit, MonthlyLimitRequest } from '../../../core/models/monthly-limit.model';
import { RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import { TransactionMethod } from '../../../core/models/transaction-method.model';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import { TransactionMethodService } from '../../../core/services/transaction-method.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { MonthlyLimitService } from '../../../core/services/monthly-limit.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecurringExpenseService } from '../../../core/services/recurring-expense.service';
import { defaultPeriod } from '../../../core/utils/default-period.util';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { MonthPeriod, MonthSwitcher } from '../../../shared/month-switcher/month-switcher';
import { ExpenseFormModal } from '../../expenses/expense-form-modal/expense-form-modal';
import { MonthlyLimitFormModal } from '../../monthly-limits/monthly-limit-form-modal/monthly-limit-form-modal';
import { DashboardCategoryBreakdown } from '../dashboard-category-breakdown/dashboard-category-breakdown';
import { DashboardMonthlyChart } from '../dashboard-monthly-chart/dashboard-monthly-chart';
import { DashboardOverview } from '../dashboard-overview/dashboard-overview';
import { DashboardRecentExpenses } from '../dashboard-recent-expenses/dashboard-recent-expenses';
import { DashboardSummaryCards } from '../dashboard-summary-cards/dashboard-summary-cards';

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const GENERIC_LOAD_ERROR = 'Não foi possível carregar o Dashboard. Tente novamente.';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CurrencyPipe,
    LucideAngularModule,
    RouterLink,
    MonthSwitcher,
    DashboardSummaryCards,
    DashboardOverview,
    DashboardRecentExpenses,
    DashboardMonthlyChart,
    DashboardCategoryBreakdown,
    ExpenseFormModal,
    MonthlyLimitFormModal,
  ],
  templateUrl: './dashboard-page.html',
  styleUrls: ['../../list-page.scss', './dashboard-page.scss'],
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionMethodService = inject(TransactionMethodService);
  private readonly expenseService = inject(ExpenseService);
  private readonly recurringExpenseService = inject(RecurringExpenseService);
  private readonly monthlyLimitService = inject(MonthlyLimitService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  private readonly initialPeriod = defaultPeriod();
  readonly month = signal(this.initialPeriod.month);
  readonly year = signal(this.initialPeriod.year);

  readonly userFirstName = signal<string | null>(null);

  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly categories = signal<Category[]>([]);
  readonly transactionMethods = signal<TransactionMethod[]>([]);

  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly currentLimit = signal<MonthlyLimit | null>(null);
  readonly limitModalOpen = signal(false);
  readonly limitSaving = signal(false);
  readonly limitError = signal<string | null>(null);
  readonly hasLimit = computed(() => this.currentLimit() != null);

  readonly todayExpensesTotal = computed(() => {
    const todayStr = toDateOnly(new Date());
    return (this.data()?.recentExpenses ?? [])
      .filter((expense) => expense.expenseDate === todayStr)
      .reduce((sum, expense) => sum + expense.amount, 0);
  });

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.notificationService.error('Não foi possível carregar as categorias.'),
    });
    this.transactionMethodService.list().subscribe({
      next: (methods) => this.transactionMethods.set(methods),
      error: () => this.notificationService.error('Não foi possível carregar as formas de pagamento.'),
    });

    this.authService.getCurrentUser().subscribe({
      next: (user) => this.userFirstName.set(user.name.split(' ')[0]),
      error: () => this.userFirstName.set(null),
    });

    this.loadDashboard();
    this.loadLimit();
  }

  onPeriodChange(period: MonthPeriod): void {
    this.month.set(period.month);
    this.year.set(period.year);
    this.loadDashboard();
    this.loadLimit();
  }

  retry(): void {
    this.loadDashboard();
  }

  openCreateExpense(): void {
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveExpense(request: ExpenseRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.expenseService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success('Despesa criada com sucesso.');
        this.loadDashboard();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  saveRecurringExpense(request: RecurringExpenseRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.recurringExpenseService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success('Despesa fixa criada com sucesso.');
        this.loadDashboard();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  openLimitModal(): void {
    this.limitError.set(null);
    this.limitModalOpen.set(true);
  }

  closeLimitModal(): void {
    this.limitModalOpen.set(false);
  }

  saveLimit(request: MonthlyLimitRequest): void {
    this.limitSaving.set(true);
    this.limitError.set(null);
    const current = this.currentLimit();
    const operation = current
      ? this.monthlyLimitService.update(current.id, request)
      : this.monthlyLimitService.create(request);

    operation.subscribe({
      next: () => {
        this.limitSaving.set(false);
        this.limitModalOpen.set(false);
        this.notificationService.success(current ? 'Limite atualizado com sucesso.' : 'Limite definido com sucesso.');
        this.loadLimit();
        this.loadDashboard();
      },
      error: (err: unknown) => {
        this.limitSaving.set(false);
        this.limitError.set(getErrorDetail(err));
      },
    });
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getDashboard(this.month(), this.year()).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(GENERIC_LOAD_ERROR);
        if (err instanceof HttpErrorResponse && err.status === 400) {
          this.notificationService.error(getErrorDetail(err));
        }
      },
    });
  }

  private loadLimit(): void {
    this.monthlyLimitService.getByPeriod(this.month(), this.year()).subscribe({
      next: (limit) => this.currentLimit.set(limit),
      error: () => this.currentLimit.set(null),
    });
  }
}
