import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Expense, ExpenseFilters, ExpenseRequest } from '../../../core/models/expense.model';
import { Page } from '../../../core/models/page.model';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/payment-method.model';
import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { Badge } from '../../../shared/badge/badge';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Pagination } from '../../../shared/pagination/pagination';
import { ExpenseFormModal } from '../expense-form-modal/expense-form-modal';

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
  ],
  templateUrl: './expense-list.html',
  styleUrls: ['../../list-page.scss', './expense-list.scss'],
})
export class ExpenseList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly categories = signal<Category[]>([]);
  readonly pageData = signal<Page<Expense> | null>(null);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);
  readonly filtersActive = signal(false);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;

  readonly modalOpen = signal(false);
  readonly editingExpense = signal<Expense | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly expensePendingDelete = signal<Expense | null>(null);

  private filters: ExpenseFilters = { page: 0, size: DEFAULT_SIZE, sort: 'expenseDate,desc' };

  readonly filterForm = this.fb.nonNullable.group({
    categoryId: [''],
    paymentMethod: [''],
    startDate: [''],
    endDate: [''],
    description: [''],
    sort: ['expenseDate,desc'],
  });

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.notificationService.error('Não foi possível carregar as categorias.'),
    });
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.expenseService.list(this.filters).subscribe({
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
      startDate: value.startDate || undefined,
      endDate: value.endDate || undefined,
      description: value.description || undefined,
      sort: value.sort,
      page: 0,
      size: this.filters.size,
    };
    this.filtersActive.set(
      !!(value.categoryId || value.paymentMethod || value.startDate || value.endDate || value.description),
    );
    this.fetch();
  }

  clearFilters(): void {
    this.filterForm.reset({
      categoryId: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      description: '',
      sort: 'expenseDate,desc',
    });
    this.filtersActive.set(false);
    this.filters = { page: 0, size: this.filters.size, sort: 'expenseDate,desc' };
    this.fetch();
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
    this.saving.set(true);
    this.saveError.set(null);
    const editing = this.editingExpense();

    const operation = editing
      ? this.expenseService.update(editing.id, request)
      : this.expenseService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success(editing ? 'Despesa atualizada.' : 'Despesa criada.');
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  requestDelete(expense: Expense): void {
    this.expensePendingDelete.set(expense);
  }

  cancelDelete(): void {
    this.expensePendingDelete.set(null);
  }

  confirmDelete(): void {
    const expense = this.expensePendingDelete();
    if (!expense) {
      return;
    }
    this.expenseService.delete(expense.id).subscribe({
      next: () => {
        this.expensePendingDelete.set(null);
        this.notificationService.success('Despesa excluída.');
        const page = this.pageData();
        if (page && page.content.length === 1 && this.filters.page && this.filters.page > 0) {
          this.filters = { ...this.filters, page: this.filters.page - 1 };
        }
        this.fetch();
      },
      error: (err: unknown) => {
        this.expensePendingDelete.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }
}
