import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Expense, ExpenseFilters, ExpenseRequest } from '../../../core/models/expense.model';
import { Page } from '../../../core/models/page.model';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/payment-method.model';
import { RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import { RecurringUpdateScope } from '../../../core/models/recurring-update-scope.model';
import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecurringExpenseService } from '../../../core/services/recurring-expense.service';
import { firstDayOfMonth, lastDayOfMonth } from '../../../core/utils/recurrence-date.util';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { Badge } from '../../../shared/badge/badge';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { MonthPeriod, MonthSwitcher } from '../../../shared/month-switcher/month-switcher';
import { Pagination } from '../../../shared/pagination/pagination';
import { ExpenseFormModal } from '../expense-form-modal/expense-form-modal';
import { RecurringDeleteScopeModal } from '../recurring-delete-scope-modal/recurring-delete-scope-modal';
import { RecurringEditScopeModal } from '../recurring-edit-scope-modal/recurring-edit-scope-modal';

const DEFAULT_SIZE = 10;

@Component({
  selector: 'app-expense-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    Badge,
    Pagination,
    EmptyState,
    ConfirmDialog,
    ExpenseFormModal,
    RecurringEditScopeModal,
    RecurringDeleteScopeModal,
    MonthSwitcher,
  ],
  templateUrl: './expense-list.html',
  styleUrls: ['../../list-page.scss', './expense-list.scss'],
})
export class ExpenseList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly recurringExpenseService = inject(RecurringExpenseService);
  private readonly notificationService = inject(NotificationService);

  private readonly today = new Date();
  readonly month = signal(this.today.getMonth() + 1);
  readonly year = signal(this.today.getFullYear());

  readonly categories = signal<Category[]>([]);
  readonly pageData = signal<Page<Expense> | null>(null);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);
  readonly filtersActive = signal(false);
  readonly filtersOpen = signal(false);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;

  readonly modalOpen = signal(false);
  readonly editingExpense = signal<Expense | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly expensePendingDelete = signal<Expense | null>(null);

  readonly editScopeRequest = signal<ExpenseRequest | null>(null);
  readonly deleteScopeExpense = signal<Expense | null>(null);

  private filters: ExpenseFilters = { page: 0, size: DEFAULT_SIZE, sort: 'expenseDate,desc' };

  readonly filterForm = this.fb.nonNullable.group({
    categoryId: [''],
    paymentMethod: [''],
    description: [''],
    recurring: [''],
    sort: ['expenseDate,desc'],
  });

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.notificationService.error('Não foi possível carregar as categorias.'),
    });
    this.fetch();
  }

  onPeriodChange(period: MonthPeriod): void {
    this.month.set(period.month);
    this.year.set(period.year);
    this.filters = { ...this.filters, page: 0 };
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.listError.set(null);
    const request: ExpenseFilters = {
      ...this.filters,
      startDate: firstDayOfMonth(this.year(), this.month()),
      endDate: lastDayOfMonth(this.year(), this.month()),
    };
    this.expenseService.list(request).subscribe({
      next: (page) => {
        this.pageData.set(page);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.listError.set(getErrorDetail(err));
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    const value = this.filterForm.getRawValue();
    this.filters = {
      categoryId: value.categoryId ? Number(value.categoryId) : undefined,
      paymentMethod: (value.paymentMethod as PaymentMethod) || undefined,
      description: value.description || undefined,
      recurring: value.recurring ? value.recurring === 'true' : undefined,
      sort: value.sort,
      page: 0,
      size: this.filters.size,
    };
    this.filtersActive.set(!!(value.categoryId || value.paymentMethod || value.description || value.recurring));
    this.fetch();
  }

  clearFilters(): void {
    this.filterForm.reset({
      categoryId: '',
      paymentMethod: '',
      description: '',
      recurring: '',
      sort: 'expenseDate,desc',
    });
    this.filtersActive.set(false);
    this.filters = { page: 0, size: this.filters.size, sort: 'expenseDate,desc' };
    this.fetch();
  }

  toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  onPageChange(page: number): void {
    this.filters = { ...this.filters, page };
    this.fetch();
  }

  onSizeChange(size: number): void {
    this.filters = { ...this.filters, size, page: 0 };
    this.fetch();
  }

  openCreate(): void {
    this.editingExpense.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(expense: Expense): void {
    this.editingExpense.set(expense);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(request: ExpenseRequest): void {
    const editing = this.editingExpense();

    if (editing && editing.recurring) {
      this.editScopeRequest.set(request);
      return;
    }

    this.persistSave(request, 'ONLY_THIS');
  }

  saveRecurring(request: RecurringExpenseRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.recurringExpenseService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success('Despesa fixa criada com sucesso.');
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  cancelEditScope(): void {
    this.editScopeRequest.set(null);
  }

  confirmEditScope(scope: RecurringUpdateScope): void {
    const request = this.editScopeRequest();
    if (!request) {
      return;
    }
    this.editScopeRequest.set(null);
    this.persistSave(request, scope);
  }

  private persistSave(request: ExpenseRequest, scope: RecurringUpdateScope): void {
    this.saving.set(true);
    this.saveError.set(null);
    const editing = this.editingExpense();

    const operation = editing
      ? this.expenseService.update(editing.id, request, scope)
      : this.expenseService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success(this.saveSuccessMessage(!!editing, scope));
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  private saveSuccessMessage(isEdit: boolean, scope: RecurringUpdateScope): string {
    if (!isEdit) {
      return 'Despesa criada com sucesso.';
    }
    return scope === 'THIS_AND_FUTURE'
      ? 'A alteração será aplicada às próximas despesas.'
      : 'Despesa atualizada com sucesso.';
  }

  requestDelete(expense: Expense): void {
    if (expense.recurring) {
      this.deleteScopeExpense.set(expense);
      return;
    }
    this.expensePendingDelete.set(expense);
  }

  cancelDelete(): void {
    this.expensePendingDelete.set(null);
  }

  cancelDeleteScope(): void {
    this.deleteScopeExpense.set(null);
  }

  confirmDeleteScope(scope: RecurringUpdateScope): void {
    const expense = this.deleteScopeExpense();
    if (!expense) {
      return;
    }
    this.deleteScopeExpense.set(null);
    this.performDelete(expense, scope);
  }

  confirmDelete(): void {
    const expense = this.expensePendingDelete();
    if (!expense) {
      return;
    }
    this.expensePendingDelete.set(null);
    this.performDelete(expense, 'ONLY_THIS');
  }

  private performDelete(expense: Expense, scope: RecurringUpdateScope): void {
    this.expenseService.delete(expense.id, scope).subscribe({
      next: () => {
        this.notificationService.success('Despesa excluída com sucesso.');
        const page = this.pageData();
        if (page && page.content.length === 1 && this.filters.page && this.filters.page > 0) {
          this.filters = { ...this.filters, page: this.filters.page - 1 };
        }
        this.fetch();
      },
      error: (err: unknown) => {
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }
}
