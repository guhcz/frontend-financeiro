import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { monthName } from '../../../core/constants/months';
import { Category } from '../../../core/models/category.model';
import { PAYMENT_METHOD_LABELS } from '../../../core/models/payment-method.model';
import { Page } from '../../../core/models/page.model';
import {
  RecurrenceStatus,
  RecurringExpense,
  RecurringExpenseRequest,
  RecurringExpenseUpdateRequest,
} from '../../../core/models/recurring-expense.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecurringExpenseService } from '../../../core/services/recurring-expense.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { Badge } from '../../../shared/badge/badge';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { MonthPeriod, MonthSwitcher } from '../../../shared/month-switcher/month-switcher';
import { Pagination } from '../../../shared/pagination/pagination';
import { RecurringExpenseFormModal } from '../recurring-expense-form-modal/recurring-expense-form-modal';

const DEFAULT_SIZE = 10;

type PendingActionKind = 'pause' | 'resume' | 'end';

interface PendingAction {
  rule: RecurringExpense;
  kind: PendingActionKind;
}

interface StatusInfo {
  label: string;
  color: string;
}

const STATUS_INFO: Record<RecurrenceStatus, StatusInfo> = {
  ACTIVE: { label: 'Ativa', color: '#16a34a' },
  PAUSED: { label: 'Pausada', color: '#d97706' },
  ENDED: { label: 'Encerrada', color: '#6b7280' },
};

const PENDING_ACTION_CONFIG: Record<PendingActionKind, { title: string; message: string; confirmLabel: string; variant: 'danger' | 'primary' }> = {
  pause: {
    title: 'Pausar despesa fixa?',
    message:
      'Novas despesas não serão geradas enquanto esta recorrência estiver pausada. As despesas já geradas serão mantidas.',
    confirmLabel: 'Pausar recorrência',
    variant: 'primary',
  },
  resume: {
    title: 'Reativar despesa fixa?',
    message: 'A geração das próximas despesas será retomada.',
    confirmLabel: 'Reativar recorrência',
    variant: 'primary',
  },
  end: {
    title: 'Encerrar despesa fixa?',
    message: 'Essa ação interromperá as próximas cobranças. As despesas já registradas continuarão no histórico.',
    confirmLabel: 'Encerrar recorrência',
    variant: 'danger',
  },
};

@Component({
  selector: 'app-recurring-expense-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    Badge,
    Pagination,
    EmptyState,
    ConfirmDialog,
    RecurringExpenseFormModal,
    MonthSwitcher,
  ],
  templateUrl: './recurring-expense-list.html',
  styleUrls: ['../../list-page.scss', './recurring-expense-list.scss'],
})
export class RecurringExpenseList implements OnInit {
  private readonly recurringExpenseService = inject(RecurringExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  private readonly today = new Date();
  readonly month = signal(this.today.getMonth() + 1);
  readonly year = signal(this.today.getFullYear());

  readonly categories = signal<Category[]>([]);
  readonly pageData = signal<Page<RecurringExpense> | null>(null);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);

  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;

  readonly modalOpen = signal(false);
  readonly editingRule = signal<RecurringExpense | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly pendingAction = signal<PendingAction | null>(null);
  readonly processingAction = signal(false);

  private page = 0;
  private readonly size = DEFAULT_SIZE;

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
    this.page = 0;
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.listError.set(null);
    const params = { page: this.page, size: this.size, referenceMonth: this.month(), referenceYear: this.year() };
    this.recurringExpenseService.list(params).subscribe({
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

  onPageChange(page: number): void {
    this.page = page;
    this.fetch();
  }

  onSizeChange(size: number): void {
    this.page = 0;
    const params = { page: 0, size, referenceMonth: this.month(), referenceYear: this.year() };
    this.recurringExpenseService.list(params).subscribe({
      next: (page) => this.pageData.set(page),
      error: (err: unknown) => this.listError.set(getErrorDetail(err)),
    });
  }

  statusInfo(status: RecurrenceStatus): StatusInfo {
    return STATUS_INFO[status];
  }

  periodLabel(rule: RecurringExpense): string {
    const start = this.monthYearLabel(rule.startDate);
    const end = rule.endDate ? this.monthYearLabel(rule.endDate) : 'Sem término';
    return `${start} – ${end}`;
  }

  private monthYearLabel(isoDate: string): string {
    const date = new Date(isoDate + 'T00:00:00');
    return `${monthName(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  openCreate(): void {
    this.editingRule.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(rule: RecurringExpense): void {
    this.editingRule.set(rule);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(request: RecurringExpenseRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    const editing = this.editingRule();

    const operation = editing
      ? this.recurringExpenseService.update(editing.id, this.toUpdateRequest(request))
      : this.recurringExpenseService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success(editing ? 'Despesa fixa atualizada com sucesso.' : 'Despesa fixa criada com sucesso.');
        this.fetch();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  private toUpdateRequest(request: RecurringExpenseRequest): RecurringExpenseUpdateRequest {
    return {
      categoryId: request.categoryId,
      description: request.description,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      notes: request.notes,
      dueDay: request.dueDay,
      endDate: request.endDate,
    };
  }

  requestPause(rule: RecurringExpense): void {
    this.pendingAction.set({ rule, kind: 'pause' });
  }

  requestResume(rule: RecurringExpense): void {
    this.pendingAction.set({ rule, kind: 'resume' });
  }

  requestEnd(rule: RecurringExpense): void {
    this.pendingAction.set({ rule, kind: 'end' });
  }

  pendingActionConfig() {
    const action = this.pendingAction();
    return action ? PENDING_ACTION_CONFIG[action.kind] : null;
  }

  cancelAction(): void {
    this.pendingAction.set(null);
  }

  confirmAction(): void {
    const action = this.pendingAction();
    if (!action) {
      return;
    }
    this.processingAction.set(true);

    const onSettled = (successMessage: string, err?: unknown) => {
      this.processingAction.set(false);
      this.pendingAction.set(null);
      if (err !== undefined) {
        this.notificationService.error(getErrorDetail(err));
        return;
      }
      this.notificationService.success(successMessage);
      this.fetch();
    };

    if (action.kind === 'pause') {
      this.recurringExpenseService.pause(action.rule.id).subscribe({
        next: () => onSettled('Recorrência pausada com sucesso.'),
        error: (err: unknown) => onSettled('', err),
      });
    } else if (action.kind === 'resume') {
      this.recurringExpenseService.resume(action.rule.id).subscribe({
        next: () => onSettled('Recorrência reativada com sucesso.'),
        error: (err: unknown) => onSettled('', err),
      });
    } else {
      this.recurringExpenseService.delete(action.rule.id).subscribe({
        next: () => onSettled('Recorrência encerrada com sucesso.'),
        error: (err: unknown) => onSettled('', err),
      });
    }
  }
}
