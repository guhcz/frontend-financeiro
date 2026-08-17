import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Page } from '../../../core/models/page.model';
import {
  TRANSACTION_METHOD_TYPE_LABELS,
  TransactionMethod,
  TransactionMethodCreateRequest,
  TransactionMethodFilters,
  TransactionMethodType,
} from '../../../core/models/transaction-method.model';
import { TransactionMethodService } from '../../../core/services/transaction-method.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Pagination } from '../../../shared/pagination/pagination';
import { TransactionMethodFormModal } from '../transaction-method-form-modal/transaction-method-form-modal';

const DEFAULT_SIZE = 10;

const TYPE_ICONS: Record<TransactionMethodType, string> = {
  PIX: 'qr-code',
  CASH: 'banknote',
  CARD: 'credit-card',
  BANK_TRANSFER: 'landmark',
  BOLETO: 'landmark',
  DEPOSIT: 'landmark',
  OTHER: 'wallet-cards',
};

@Component({
  selector: 'app-transaction-method-list',
  imports: [EmptyState, ConfirmDialog, TransactionMethodFormModal, Pagination, LucideAngularModule],
  templateUrl: './transaction-method-list.html',
  styleUrls: ['../../list-page.scss', './transaction-method-list.scss'],
})
export class TransactionMethodList implements OnInit {
  private readonly transactionMethodService = inject(TransactionMethodService);
  private readonly notificationService = inject(NotificationService);

  readonly typeLabels = TRANSACTION_METHOD_TYPE_LABELS;
  readonly typeIcons = TYPE_ICONS;

  readonly pageData = signal<Page<TransactionMethod> | null>(null);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);

  readonly modalOpen = signal(false);
  readonly editingMethod = signal<TransactionMethod | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly methodPendingDelete = signal<TransactionMethod | null>(null);
  readonly deleteError = signal<string | null>(null);

  private filters: TransactionMethodFilters = { page: 0, size: DEFAULT_SIZE };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.transactionMethodService.listPage(this.filters).subscribe({
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
    this.filters = { ...this.filters, page };
    this.load();
  }

  onSizeChange(size: number): void {
    this.filters = { ...this.filters, size, page: 0 };
    this.load();
  }

  openCreate(): void {
    this.editingMethod.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(method: TransactionMethod): void {
    this.editingMethod.set(method);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(request: TransactionMethodCreateRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    const editing = this.editingMethod();

    const operation = editing
      ? this.transactionMethodService.update(editing.id, request)
      : this.transactionMethodService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success(editing ? 'Forma de pagamento atualizada.' : 'Forma de pagamento criada.');
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  requestDelete(method: TransactionMethod): void {
    this.deleteError.set(null);
    this.methodPendingDelete.set(method);
  }

  cancelDelete(): void {
    this.methodPendingDelete.set(null);
  }

  confirmDelete(): void {
    const method = this.methodPendingDelete();
    if (!method) {
      return;
    }
    this.transactionMethodService.delete(method.id).subscribe({
      next: () => {
        this.methodPendingDelete.set(null);
        this.notificationService.success('Forma de pagamento excluída.');
        const page = this.pageData();
        if (page && page.content.length === 1 && this.filters.page && this.filters.page > 0) {
          this.filters = { ...this.filters, page: this.filters.page - 1 };
        }
        this.load();
      },
      error: (err: unknown) => {
        this.methodPendingDelete.set(null);
        this.deleteError.set(getErrorDetail(err));
      },
    });
  }
}
