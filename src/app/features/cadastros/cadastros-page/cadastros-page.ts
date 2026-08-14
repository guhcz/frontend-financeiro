import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category, CategoryRequest } from '../../../core/models/category.model';
import { RECURRENCE_FREQUENCY_LABELS } from '../../../core/models/recurrence-frequency.model';
import { RecurringExpense } from '../../../core/models/recurring-expense.model';
import {
  TRANSACTION_METHOD_TYPE_LABELS,
  TransactionMethod,
  TransactionMethodCreateRequest,
} from '../../../core/models/transaction-method.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecurringExpenseService } from '../../../core/services/recurring-expense.service';
import { TransactionMethodService } from '../../../core/services/transaction-method.service';
import { defaultPeriod } from '../../../core/utils/default-period.util';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { CategoryFormModal } from '../../categories/category-form-modal/category-form-modal';
import { TransactionMethodFormModal } from '../../transaction-methods/transaction-method-form-modal/transaction-method-form-modal';

const PREVIEW_SIZE = 5;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  ENDED: 'Encerrada',
};

@Component({
  selector: 'app-cadastros-page',
  imports: [RouterLink, CategoryFormModal, TransactionMethodFormModal],
  templateUrl: './cadastros-page.html',
  styleUrls: ['../../list-page.scss', './cadastros-page.scss'],
})
export class CadastrosPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionMethodService = inject(TransactionMethodService);
  private readonly recurringExpenseService = inject(RecurringExpenseService);
  private readonly notificationService = inject(NotificationService);

  readonly typeLabels = TRANSACTION_METHOD_TYPE_LABELS;
  readonly frequencyLabels = RECURRENCE_FREQUENCY_LABELS;
  readonly statusLabels = STATUS_LABELS;

  readonly searchTerm = signal('');

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(true);
  readonly transactionMethods = signal<TransactionMethod[]>([]);
  readonly methodsLoading = signal(true);
  readonly recurringExpenses = signal<RecurringExpense[]>([]);
  readonly recurringLoading = signal(true);

  readonly filteredCategories = computed(() =>
    this.filterByTerm(this.categories(), (item) => item.name).slice(0, PREVIEW_SIZE),
  );
  readonly filteredMethods = computed(() =>
    this.filterByTerm(this.transactionMethods(), (item) => item.name).slice(0, PREVIEW_SIZE),
  );
  readonly filteredRecurring = computed(() =>
    this.filterByTerm(this.recurringExpenses(), (item) => item.description).slice(0, PREVIEW_SIZE),
  );

  readonly categoryModalOpen = signal(false);
  readonly categorySaving = signal(false);
  readonly categorySaveError = signal<string | null>(null);

  readonly methodModalOpen = signal(false);
  readonly methodSaving = signal(false);
  readonly methodSaveError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactionMethods();
    this.loadRecurringExpenses();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  openCreateCategory(): void {
    this.categorySaveError.set(null);
    this.categoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.categoryModalOpen.set(false);
  }

  saveCategory(request: CategoryRequest): void {
    this.categorySaving.set(true);
    this.categorySaveError.set(null);
    this.categoryService.create(request).subscribe({
      next: () => {
        this.categorySaving.set(false);
        this.categoryModalOpen.set(false);
        this.notificationService.success('Categoria criada.');
        this.loadCategories();
      },
      error: (err: unknown) => {
        this.categorySaving.set(false);
        this.categorySaveError.set(getErrorDetail(err));
      },
    });
  }

  openCreateMethod(): void {
    this.methodSaveError.set(null);
    this.methodModalOpen.set(true);
  }

  closeMethodModal(): void {
    this.methodModalOpen.set(false);
  }

  saveMethod(request: TransactionMethodCreateRequest): void {
    this.methodSaving.set(true);
    this.methodSaveError.set(null);
    this.transactionMethodService.create(request).subscribe({
      next: () => {
        this.methodSaving.set(false);
        this.methodModalOpen.set(false);
        this.notificationService.success('Forma de pagamento criada.');
        this.loadTransactionMethods();
      },
      error: (err: unknown) => {
        this.methodSaving.set(false);
        this.methodSaveError.set(getErrorDetail(err));
      },
    });
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoryService.listPage({ page: 0, size: 50 }).subscribe({
      next: (page) => {
        this.categories.set(page.content);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Não foi possível carregar as categorias.');
        this.categoriesLoading.set(false);
      },
    });
  }

  private loadTransactionMethods(): void {
    this.methodsLoading.set(true);
    this.transactionMethodService.list().subscribe({
      next: (methods) => {
        this.transactionMethods.set(methods);
        this.methodsLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Não foi possível carregar as formas de pagamento.');
        this.methodsLoading.set(false);
      },
    });
  }

  private loadRecurringExpenses(): void {
    this.recurringLoading.set(true);
    const period = defaultPeriod();
    const params = { page: 0, size: 50, referenceMonth: period.month, referenceYear: period.year };
    this.recurringExpenseService
      .list(params)
      .subscribe({
        next: (page) => {
          this.recurringExpenses.set(page.content);
          this.recurringLoading.set(false);
        },
        error: () => {
          this.notificationService.error('Não foi possível carregar as despesas fixas.');
          this.recurringLoading.set(false);
        },
      });
  }

  private filterByTerm<T>(items: T[], getText: (item: T) => string): T[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return items;
    }
    return items.filter((item) => getText(item).toLowerCase().includes(term));
  }
}
