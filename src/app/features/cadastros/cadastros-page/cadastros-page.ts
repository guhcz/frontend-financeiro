import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Observable } from 'rxjs';
import { Category, CategoryRequest } from '../../../core/models/category.model';
import { monthName } from '../../../core/constants/months';
import { MonthlyLimit, MonthlyLimitRequest } from '../../../core/models/monthly-limit.model';
import { RECURRENCE_FREQUENCY_LABELS } from '../../../core/models/recurrence-frequency.model';
import { RecurringExpense } from '../../../core/models/recurring-expense.model';
import { RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import { RecurringIncome, RecurringIncomeRequest } from '../../../core/models/recurring-income.model';
import {
  TRANSACTION_METHOD_TYPE_LABELS,
  TransactionMethod,
  TransactionMethodCreateRequest,
} from '../../../core/models/transaction-method.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MonthlyLimitService } from '../../../core/services/monthly-limit.service';
import { RecurringExpenseService } from '../../../core/services/recurring-expense.service';
import { RecurringIncomeService } from '../../../core/services/recurring-income.service';
import { TransactionMethodService } from '../../../core/services/transaction-method.service';
import { defaultPeriod } from '../../../core/utils/default-period.util';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { CategoryFormModal } from '../../categories/category-form-modal/category-form-modal';
import { TransactionMethodFormModal } from '../../transaction-methods/transaction-method-form-modal/transaction-method-form-modal';
import { Modal } from '../../../shared/modal/modal';
import { Pagination } from '../../../shared/pagination/pagination';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { RecurringExpenseFormModal } from '../../recurring-expenses/recurring-expense-form-modal/recurring-expense-form-modal';
import { IncomeFormModal } from '../../incomes/income-form-modal/income-form-modal';
import { MonthlyLimitFormModal } from '../../monthly-limits/monthly-limit-form-modal/monthly-limit-form-modal';

const PREVIEW_SIZE = 4;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  ENDED: 'Encerrada',
};

const RECURRENCE_STATUS_ORDER: Record<string, number> = {
  ACTIVE: 0,
  PAUSED: 1,
  ENDED: 2,
};

interface RecurringRegistryItem {
  key: string;
  id: number;
  kind: 'expense' | 'income';
  description: string;
  frequency: RecurringExpense['frequency'];
  dueDay: number | null;
  status: RecurringExpense['status'];
}

@Component({
  selector: 'app-cadastros-page',
  imports: [CurrencyPipe, LucideAngularModule, CategoryFormModal, TransactionMethodFormModal, Modal, Pagination, ConfirmDialog, RecurringExpenseFormModal, IncomeFormModal, MonthlyLimitFormModal],
  templateUrl: './cadastros-page.html',
  styleUrls: ['../../list-page.scss', './cadastros-page.scss'],
})
export class CadastrosPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionMethodService = inject(TransactionMethodService);
  private readonly recurringExpenseService = inject(RecurringExpenseService);
  private readonly recurringIncomeService = inject(RecurringIncomeService);
  private readonly monthlyLimitService = inject(MonthlyLimitService);
  private readonly notificationService = inject(NotificationService);

  readonly typeLabels = TRANSACTION_METHOD_TYPE_LABELS;
  readonly frequencyLabels = RECURRENCE_FREQUENCY_LABELS;
  readonly statusLabels = STATUS_LABELS;
  readonly monthName = monthName;

  readonly searchTerm = signal('');

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(true);
  readonly transactionMethods = signal<TransactionMethod[]>([]);
  readonly methodsLoading = signal(true);
  readonly recurringExpenses = signal<RecurringExpense[]>([]);
  readonly recurringIncomes = signal<RecurringIncome[]>([]);
  readonly recurringLoading = signal(true);
  readonly recurringIncomeLoading = signal(true);
  readonly monthlyLimits = signal<MonthlyLimit[]>([]);
  readonly limitsLoading = signal(true);

  readonly filteredCategories = computed(() =>
    this.filterByTerm(this.categories(), (item) => item.name).slice(0, PREVIEW_SIZE),
  );
  readonly filteredMethods = computed(() =>
    this.filterByTerm(this.transactionMethods(), (item) => item.name).slice(0, PREVIEW_SIZE),
  );
  readonly filteredRecurring = computed(() =>
    this.sortRecurringByStatus(
      this.filterByTerm(this.allRecurringItems(), (item) => item.description),
    ).slice(0, PREVIEW_SIZE),
  );
  readonly filteredLimits = computed(() =>
    this.filterByTerm(this.monthlyLimits(), (item) => `${monthName(item.month)} ${item.year}`)
      .slice(0, PREVIEW_SIZE),
  );

  readonly categoryModalOpen = signal(false);
  readonly categorySaving = signal(false);
  readonly categorySaveError = signal<string | null>(null);

  readonly methodModalOpen = signal(false);
  readonly methodSaving = signal(false);
  readonly methodSaveError = signal<string | null>(null);

  readonly listModal = signal<'categories' | 'methods' | 'recurring' | 'limits' | null>(null);
  readonly modalSearch = signal('');
  readonly modalStatus = signal('ALL');
  readonly modalType = signal('ALL');
  readonly modalPage = signal(0);
  readonly modalPageSize = signal(5);
  readonly openActionMenu = signal<string | null>(null);
  readonly categoryPendingDelete = signal<Category | null>(null);
  readonly methodPendingDelete = signal<TransactionMethod | null>(null);
  readonly recurringPendingPause = signal<RecurringRegistryItem | null>(null);
  readonly recurringTypeModalOpen = signal(false);
  readonly recurringExpenseModalOpen = signal(false);
  readonly recurringIncomeModalOpen = signal(false);
  readonly recurringSaving = signal(false);
  readonly recurringSaveError = signal<string | null>(null);
  readonly limitModalOpen = signal(false);
  readonly editingLimit = signal<MonthlyLimit | null>(null);
  readonly limitSaving = signal(false);
  readonly limitSaveError = signal<string | null>(null);
  readonly limitPendingDelete = signal<MonthlyLimit | null>(null);

  readonly modalCategories = computed(() =>
    this.filterModalItems(this.categories(), (item) => item.name).filter(
      (item) => this.modalStatus() === 'ALL' || String(item.active) === this.modalStatus(),
    ),
  );
  readonly modalMethods = computed(() =>
    this.filterModalItems(this.transactionMethods(), (item) => item.name).filter(
      (item) =>
        (this.modalStatus() === 'ALL' || String(item.active) === this.modalStatus()) &&
        (this.modalType() === 'ALL' || item.type === this.modalType()),
    ),
  );
  readonly modalRecurring = computed(() =>
    this.sortRecurringByStatus(
      this.filterModalItems(this.allRecurringItems(), (item) => item.description).filter(
        (item) =>
          (this.modalStatus() === 'ALL' || item.status === this.modalStatus()) &&
          (this.modalType() === 'ALL' || item.kind === this.modalType()),
      ),
    ),
  );
  readonly modalLimits = computed(() =>
    this.filterModalItems(this.monthlyLimits(), (item) => `${monthName(item.month)} ${item.year}`).filter(
      (item) => this.modalStatus() === 'ALL' || String(item.active) === this.modalStatus(),
    ),
  );
  readonly modalTotalElements = computed(() => this.activeModalItems().length);
  readonly modalTotalPages = computed(() => Math.ceil(this.modalTotalElements() / this.modalPageSize()));
  readonly pagedModalCategories = computed(() => this.paginate(this.modalCategories()));
  readonly pagedModalMethods = computed(() => this.paginate(this.modalMethods()));
  readonly pagedModalRecurring = computed(() => this.paginate(this.modalRecurring()));
  readonly pagedModalLimits = computed(() => this.paginate(this.modalLimits()));

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactionMethods();
    this.loadRecurringExpenses();
    this.loadRecurringIncomes();
    this.loadMonthlyLimits();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  openListModal(kind: 'categories' | 'methods' | 'recurring' | 'limits'): void {
    this.listModal.set(kind);
    this.modalSearch.set('');
    this.modalStatus.set('ALL');
    this.modalType.set('ALL');
    this.modalPage.set(0);
  }

  closeListModal(): void {
    this.listModal.set(null);
  }

  createFromList(kind: 'categories' | 'methods'): void {
    this.closeListModal();
    if (kind === 'categories') {
      this.openCreateCategory();
    } else {
      this.openCreateMethod();
    }
  }

  updateModalSearch(term: string): void {
    this.modalSearch.set(term);
    this.modalPage.set(0);
  }

  updateModalStatus(status: string): void {
    this.modalStatus.set(status);
    this.modalPage.set(0);
  }

  updateModalType(type: string): void {
    this.modalType.set(type);
    this.modalPage.set(0);
  }

  onModalPageChange(page: number): void {
    this.modalPage.set(page);
  }

  onModalSizeChange(size: number): void {
    this.modalPageSize.set(size);
    this.modalPage.set(0);
  }

  toggleActionMenu(key: string): void {
    this.openActionMenu.update((current) => (current === key ? null : key));
  }

  requestCategoryDelete(category: Category): void {
    this.openActionMenu.set(null);
    this.categoryPendingDelete.set(category);
  }

  requestMethodDelete(method: TransactionMethod): void {
    this.openActionMenu.set(null);
    this.methodPendingDelete.set(method);
  }

  requestRecurringPause(rule: RecurringRegistryItem): void {
    this.openActionMenu.set(null);
    this.recurringPendingPause.set(rule);
  }

  openCreateLimit(): void {
    this.closeListModal();
    this.editingLimit.set(null);
    this.limitSaveError.set(null);
    this.limitModalOpen.set(true);
  }

  openEditLimit(limit: MonthlyLimit): void {
    this.closeListModal();
    this.openActionMenu.set(null);
    this.editingLimit.set(limit);
    this.limitSaveError.set(null);
    this.limitModalOpen.set(true);
  }

  closeLimitModal(): void {
    this.limitModalOpen.set(false);
  }

  saveLimit(request: MonthlyLimitRequest): void {
    this.limitSaving.set(true);
    const editing = this.editingLimit();
    const operation = editing
      ? this.monthlyLimitService.update(editing.id, request)
      : this.monthlyLimitService.create(request);
    operation.subscribe({
      next: () => {
        this.limitSaving.set(false);
        this.limitModalOpen.set(false);
        this.notificationService.success(editing ? 'Limite atualizado.' : 'Limite criado.');
        this.loadMonthlyLimits();
      },
      error: (err: unknown) => {
        this.limitSaving.set(false);
        this.limitSaveError.set(getErrorDetail(err));
      },
    });
  }

  requestLimitDelete(limit: MonthlyLimit): void {
    this.openActionMenu.set(null);
    this.limitPendingDelete.set(limit);
  }

  confirmLimitDelete(): void {
    const limit = this.limitPendingDelete();
    if (!limit) return;
    this.monthlyLimitService.delete(limit.id).subscribe({
      next: () => {
        this.limitPendingDelete.set(null);
        this.notificationService.success('Limite excluído.');
        this.loadMonthlyLimits();
      },
      error: (err: unknown) => {
        this.limitPendingDelete.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }

  openRecurringTypeModal(): void {
    this.closeListModal();
    this.recurringTypeModalOpen.set(true);
  }

  chooseRecurringType(kind: 'expense' | 'income'): void {
    this.recurringTypeModalOpen.set(false);
    this.recurringSaveError.set(null);
    if (kind === 'expense') this.recurringExpenseModalOpen.set(true);
    else this.recurringIncomeModalOpen.set(true);
  }

  closeRecurringForm(): void {
    this.recurringExpenseModalOpen.set(false);
    this.recurringIncomeModalOpen.set(false);
    this.recurringSaveError.set(null);
  }

  saveRecurringExpense(request: RecurringExpenseRequest): void {
    this.recurringSaving.set(true);
    this.recurringExpenseService.create(request).subscribe({
      next: () => this.finishRecurringSave('Despesa fixa criada.'),
      error: (err: unknown) => this.failRecurringSave(err),
    });
  }

  saveRecurringIncome(request: RecurringIncomeRequest): void {
    this.recurringSaving.set(true);
    this.recurringIncomeService.create(request).subscribe({
      next: () => this.finishRecurringSave('Receita fixa criada.'),
      error: (err: unknown) => this.failRecurringSave(err),
    });
  }

  cancelPendingAction(): void {
    this.categoryPendingDelete.set(null);
    this.methodPendingDelete.set(null);
    this.recurringPendingPause.set(null);
    this.limitPendingDelete.set(null);
  }

  confirmCategoryDelete(): void {
    const category = this.categoryPendingDelete();
    if (!category) return;
    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.categoryPendingDelete.set(null);
        this.notificationService.success('Categoria excluída.');
        this.loadCategories();
      },
      error: (err: unknown) => {
        this.categoryPendingDelete.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }

  confirmMethodDelete(): void {
    const method = this.methodPendingDelete();
    if (!method) return;
    this.transactionMethodService.delete(method.id).subscribe({
      next: () => {
        this.methodPendingDelete.set(null);
        this.notificationService.success('Forma de pagamento excluída.');
        this.loadTransactionMethods();
      },
      error: (err: unknown) => {
        this.methodPendingDelete.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }

  confirmRecurringPause(): void {
    const rule = this.recurringPendingPause();
    if (!rule) return;
    const operation: Observable<unknown> = rule.kind === 'expense'
      ? this.recurringExpenseService.pause(rule.id)
      : this.recurringIncomeService.pause(rule.id);
    operation.subscribe({
      next: () => {
        this.recurringPendingPause.set(null);
        this.notificationService.success('Recorrência desativada.');
        this.loadRecurringExpenses();
        this.loadRecurringIncomes();
      },
      error: (err: unknown) => {
        this.recurringPendingPause.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
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

  private loadRecurringIncomes(): void {
    this.recurringIncomeLoading.set(true);
    const period = defaultPeriod();
    const params = { page: 0, size: 50, referenceMonth: period.month, referenceYear: period.year };
    this.recurringIncomeService.list(params).subscribe({
      next: (page) => {
        this.recurringIncomes.set(page.content);
        this.recurringIncomeLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Não foi possível carregar as receitas fixas.');
        this.recurringIncomeLoading.set(false);
      },
    });
  }

  private loadMonthlyLimits(): void {
    this.limitsLoading.set(true);
    this.monthlyLimitService.list().subscribe({
      next: (limits) => {
        this.monthlyLimits.set([...limits].sort((a, b) => b.year - a.year || b.month - a.month));
        this.limitsLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Não foi possível carregar os limites mensais.');
        this.limitsLoading.set(false);
      },
    });
  }

  private allRecurringItems(): RecurringRegistryItem[] {
    const expenses = this.recurringExpenses().map((item) => ({
      key: `expense-${item.id}`,
      id: item.id,
      kind: 'expense' as const,
      description: item.description,
      frequency: item.frequency,
      dueDay: item.dueDay,
      status: item.status,
    }));
    const incomes = this.recurringIncomes().map((item) => ({
      key: `income-${item.id}`,
      id: item.id,
      kind: 'income' as const,
      description: item.description,
      frequency: item.frequency,
      dueDay: item.receiptDay,
      status: item.status,
    }));
    return [...expenses, ...incomes];
  }

  private finishRecurringSave(message: string): void {
    this.recurringSaving.set(false);
    this.closeRecurringForm();
    this.notificationService.success(message);
    this.loadRecurringExpenses();
    this.loadRecurringIncomes();
  }

  private failRecurringSave(err: unknown): void {
    this.recurringSaving.set(false);
    this.recurringSaveError.set(getErrorDetail(err));
  }

  private filterByTerm<T>(items: T[], getText: (item: T) => string): T[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return items;
    }
    return items.filter((item) => getText(item).toLowerCase().includes(term));
  }

  private filterModalItems<T>(items: T[], getText: (item: T) => string): T[] {
    const term = this.modalSearch().trim().toLowerCase();
    return term ? items.filter((item) => getText(item).toLowerCase().includes(term)) : items;
  }

  private activeModalItems(): unknown[] {
    if (this.listModal() === 'categories') return this.modalCategories();
    if (this.listModal() === 'methods') return this.modalMethods();
    if (this.listModal() === 'recurring') return this.modalRecurring();
    return this.modalLimits();
  }

  private paginate<T>(items: T[]): T[] {
    const start = this.modalPage() * this.modalPageSize();
    return items.slice(start, start + this.modalPageSize());
  }

  private sortRecurringByStatus(items: RecurringRegistryItem[]): RecurringRegistryItem[] {
    return [...items].sort(
      (a, b) => RECURRENCE_STATUS_ORDER[a.status] - RECURRENCE_STATUS_ORDER[b.status],
    );
  }

}
