import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Expense, ExpenseRequest } from '../../../core/models/expense.model';
import { Income, IncomeRequest } from '../../../core/models/income.model';
import { Page } from '../../../core/models/page.model';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/payment-method.model';
import { RECEIPT_METHOD_LABELS, ReceiptMethod } from '../../../core/models/receipt-method.model';
import { RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import { RecurringIncomeRequest } from '../../../core/models/recurring-income.model';
import { RecurringUpdateScope } from '../../../core/models/recurring-update-scope.model';
import { TransactionFilters, TransactionListItem, TransactionType } from '../../../core/models/transaction.model';
import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { IncomeService } from '../../../core/services/income.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecurringExpenseService } from '../../../core/services/recurring-expense.service';
import { RecurringIncomeService } from '../../../core/services/recurring-income.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { firstDayOfMonth, lastDayOfMonth } from '../../../core/utils/recurrence-date.util';
import { Badge } from '../../../shared/badge/badge';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { MonthPeriod, MonthSwitcher } from '../../../shared/month-switcher/month-switcher';
import { Pagination } from '../../../shared/pagination/pagination';
import { ExpenseFormModal } from '../../expenses/expense-form-modal/expense-form-modal';
import { RecurringDeleteScopeModal } from '../../expenses/recurring-delete-scope-modal/recurring-delete-scope-modal';
import { RecurringEditScopeModal } from '../../expenses/recurring-edit-scope-modal/recurring-edit-scope-modal';
import { IncomeFormModal } from '../../incomes/income-form-modal/income-form-modal';

const DEFAULT_SIZE = 10;

const METHOD_LABELS: Record<string, string> = { ...PAYMENT_METHOD_LABELS, ...RECEIPT_METHOD_LABELS };

const TYPE_INFO: Record<TransactionType, { label: string; color: string }> = {
  INCOME: { label: 'Receita', color: '#16a34a' },
  EXPENSE: { label: 'Despesa', color: '#dc2626' },
};

type ActiveModal = 'expense' | 'income' | null;

interface EditScopeRequest {
  type: TransactionType;
  id: number;
  expenseRequest?: ExpenseRequest;
  incomeRequest?: IncomeRequest;
}

const EXPENSE_EDIT_SCOPE_TEXT = {
  title: 'O que você deseja alterar?',
  onlyThisLabel: 'Somente esta despesa',
  onlyThisDescription:
    'Altera apenas o lançamento selecionado. Os próximos meses continuarão com os dados atuais da recorrência.',
  thisAndFutureLabel: 'Esta e as próximas despesas',
  thisAndFutureDescription: 'Altera este lançamento e atualiza a regra usada para gerar os próximos meses.',
};

const INCOME_EDIT_SCOPE_TEXT = {
  title: 'O que você deseja alterar?',
  onlyThisLabel: 'Somente esta receita',
  onlyThisDescription: 'Altera apenas este recebimento.',
  thisAndFutureLabel: 'Esta e as próximas receitas',
  thisAndFutureDescription: 'Atualiza este recebimento e a regra usada para os próximos meses.',
};

const EXPENSE_DELETE_SCOPE_TEXT = {
  title: 'Como deseja excluir esta despesa?',
  onlyThisLabel: 'Excluir somente esta despesa',
  onlyThisDescription: 'Remove apenas o lançamento deste mês.',
  thisAndFutureLabel: 'Excluir esta e encerrar as próximas',
  thisAndFutureDescription: 'Remove este lançamento e impede que novas despesas sejam geradas.',
};

const INCOME_DELETE_SCOPE_TEXT = {
  title: 'Como deseja excluir esta receita?',
  onlyThisLabel: 'Excluir somente esta receita',
  onlyThisDescription: 'Remove apenas este recebimento.',
  thisAndFutureLabel: 'Excluir esta e encerrar as próximas',
  thisAndFutureDescription: 'Remove este recebimento e impede que novas receitas sejam geradas.',
};

@Component({
  selector: 'app-transaction-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    Badge,
    Pagination,
    EmptyState,
    ConfirmDialog,
    ExpenseFormModal,
    IncomeFormModal,
    RecurringEditScopeModal,
    RecurringDeleteScopeModal,
    MonthSwitcher,
  ],
  templateUrl: './transaction-list.html',
  styleUrls: ['../../list-page.scss', './transaction-list.scss'],
})
export class TransactionList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly transactionService = inject(TransactionService);
  private readonly expenseService = inject(ExpenseService);
  private readonly incomeService = inject(IncomeService);
  private readonly recurringExpenseService = inject(RecurringExpenseService);
  private readonly recurringIncomeService = inject(RecurringIncomeService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  private readonly today = new Date();
  readonly month = signal(this.today.getMonth() + 1);
  readonly year = signal(this.today.getFullYear());

  readonly categories = signal<Category[]>([]);
  readonly pageData = signal<Page<TransactionListItem> | null>(null);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);
  readonly filtersActive = signal(false);
  readonly filtersOpen = signal(false);

  readonly methodLabels = METHOD_LABELS;
  readonly typeInfo = TYPE_INFO;

  readonly activeModal = signal<ActiveModal>(null);
  readonly editingExpense = signal<Expense | null>(null);
  readonly editingIncome = signal<Income | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly pendingDelete = signal<TransactionListItem | null>(null);
  readonly deleteScopeItem = signal<TransactionListItem | null>(null);
  readonly editScopeRequest = signal<EditScopeRequest | null>(null);

  readonly editScopeTexts = computed(() =>
    this.editScopeRequest()?.type === 'INCOME' ? INCOME_EDIT_SCOPE_TEXT : EXPENSE_EDIT_SCOPE_TEXT,
  );
  readonly deleteScopeTexts = computed(() =>
    this.deleteScopeItem()?.type === 'INCOME' ? INCOME_DELETE_SCOPE_TEXT : EXPENSE_DELETE_SCOPE_TEXT,
  );

  private filters: TransactionFilters = { page: 0, size: DEFAULT_SIZE, sort: 'date,desc' };

  readonly filterForm = this.fb.nonNullable.group({
    categoryId: [''],
    type: [''],
    description: [''],
    recurring: [''],
    sort: ['date,desc'],
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
    const request: TransactionFilters = {
      ...this.filters,
      startDate: firstDayOfMonth(this.year(), this.month()),
      endDate: lastDayOfMonth(this.year(), this.month()),
    };
    this.transactionService.getTransactions(request).subscribe({
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
      type: (value.type as TransactionType) || undefined,
      description: value.description || undefined,
      recurring: value.recurring ? value.recurring === 'true' : undefined,
      sort: value.sort,
      page: 0,
      size: this.filters.size,
    };
    this.filtersActive.set(!!(value.categoryId || value.type || value.description || value.recurring));
    this.fetch();
  }

  clearFilters(): void {
    this.filterForm.reset({
      categoryId: '',
      type: '',
      description: '',
      recurring: '',
      sort: 'date,desc',
    });
    this.filtersActive.set(false);
    this.filters = { page: 0, size: this.filters.size, sort: 'date,desc' };
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

  trackByTransaction(item: TransactionListItem): string {
    return item.transactionKey ?? `${item.type}-${item.id}`;
  }

  openCreateExpense(): void {
    this.editingExpense.set(null);
    this.editingIncome.set(null);
    this.saveError.set(null);
    this.activeModal.set('expense');
  }

  openCreateIncome(): void {
    this.editingExpense.set(null);
    this.editingIncome.set(null);
    this.saveError.set(null);
    this.activeModal.set('income');
  }

  openEdit(item: TransactionListItem): void {
    this.saveError.set(null);
    if (item.type === 'EXPENSE') {
      this.editingIncome.set(null);
      this.editingExpense.set({
        id: item.id,
        category: item.category,
        description: item.description,
        amount: item.amount,
        expenseDate: item.date,
        paymentMethod: item.method as PaymentMethod,
        notes: item.notes ?? null,
        active: true,
        generatedAutomatically: item.generatedAutomatically,
        recurring: item.recurring,
        recurringExpenseId: null,
      });
      this.activeModal.set('expense');
    } else {
      this.editingExpense.set(null);
      this.editingIncome.set({
        id: item.id,
        category: item.category,
        description: item.description,
        amount: item.amount,
        incomeDate: item.date,
        receiptMethod: item.method as ReceiptMethod,
        notes: item.notes ?? null,
        active: true,
        generatedAutomatically: item.generatedAutomatically,
        recurring: item.recurring,
        recurringIncomeId: null,
      });
      this.activeModal.set('income');
    }
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  saveExpense(request: ExpenseRequest): void {
    const editing = this.editingExpense();
    if (editing && editing.recurring) {
      this.editScopeRequest.set({ type: 'EXPENSE', id: editing.id, expenseRequest: request });
      return;
    }
    this.persistExpense(request, 'ONLY_THIS', editing?.id ?? null);
  }

  saveIncome(request: IncomeRequest): void {
    const editing = this.editingIncome();
    if (editing && editing.recurring) {
      this.editScopeRequest.set({ type: 'INCOME', id: editing.id, incomeRequest: request });
      return;
    }
    this.persistIncome(request, 'ONLY_THIS', editing?.id ?? null);
  }

  saveRecurringExpense(request: RecurringExpenseRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.recurringExpenseService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.activeModal.set(null);
        this.notificationService.success('Despesa fixa criada com sucesso.');
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  saveRecurringIncome(request: RecurringIncomeRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    this.recurringIncomeService.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.activeModal.set(null);
        this.notificationService.success('Receita recorrente criada com sucesso.');
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
    if (request.type === 'EXPENSE' && request.expenseRequest) {
      this.persistExpense(request.expenseRequest, scope, request.id);
    } else if (request.type === 'INCOME' && request.incomeRequest) {
      this.persistIncome(request.incomeRequest, scope, request.id);
    }
  }

  private persistExpense(request: ExpenseRequest, scope: RecurringUpdateScope, editingId: number | null): void {
    this.saving.set(true);
    this.saveError.set(null);
    const operation = editingId
      ? this.expenseService.update(editingId, request, scope)
      : this.expenseService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.activeModal.set(null);
        this.notificationService.success(this.expenseSaveMessage(!!editingId, scope));
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  private persistIncome(request: IncomeRequest, scope: RecurringUpdateScope, editingId: number | null): void {
    this.saving.set(true);
    this.saveError.set(null);
    const operation = editingId
      ? this.incomeService.updateIncome(editingId, request, scope)
      : this.incomeService.createIncome(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.activeModal.set(null);
        this.notificationService.success(this.incomeSaveMessage(!!editingId, scope));
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  private expenseSaveMessage(isEdit: boolean, scope: RecurringUpdateScope): string {
    if (!isEdit) {
      return 'Despesa criada com sucesso.';
    }
    return scope === 'THIS_AND_FUTURE'
      ? 'A alteração será aplicada às próximas despesas.'
      : 'Despesa atualizada com sucesso.';
  }

  private incomeSaveMessage(isEdit: boolean, scope: RecurringUpdateScope): string {
    if (!isEdit) {
      return 'Receita criada com sucesso.';
    }
    return scope === 'THIS_AND_FUTURE'
      ? 'A alteração será aplicada às próximas receitas.'
      : 'Receita atualizada com sucesso.';
  }

  requestDelete(item: TransactionListItem): void {
    if (item.recurring) {
      this.deleteScopeItem.set(item);
      return;
    }
    this.pendingDelete.set(item);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  cancelDeleteScope(): void {
    this.deleteScopeItem.set(null);
  }

  confirmDeleteScope(scope: RecurringUpdateScope): void {
    const item = this.deleteScopeItem();
    if (!item) {
      return;
    }
    this.deleteScopeItem.set(null);
    this.performDelete(item, scope);
  }

  confirmDelete(): void {
    const item = this.pendingDelete();
    if (!item) {
      return;
    }
    this.pendingDelete.set(null);
    this.performDelete(item, 'ONLY_THIS');
  }

  private performDelete(item: TransactionListItem, scope: RecurringUpdateScope): void {
    const operation =
      item.type === 'EXPENSE' ? this.expenseService.delete(item.id, scope) : this.incomeService.deleteIncome(item.id, scope);

    operation.subscribe({
      next: () => {
        this.notificationService.success(
          item.type === 'EXPENSE' ? 'Despesa excluída com sucesso.' : 'Receita excluída com sucesso.',
        );
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
