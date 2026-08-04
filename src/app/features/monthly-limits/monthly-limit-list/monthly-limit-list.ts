import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { monthName } from '../../../core/constants/months';
import { MonthlyLimit, MonthlyLimitRequest } from '../../../core/models/monthly-limit.model';
import { MonthlyLimitService } from '../../../core/services/monthly-limit.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { MonthlyLimitFormModal } from '../monthly-limit-form-modal/monthly-limit-form-modal';

@Component({
  selector: 'app-monthly-limit-list',
  imports: [CurrencyPipe, EmptyState, ConfirmDialog, MonthlyLimitFormModal],
  templateUrl: './monthly-limit-list.html',
  styleUrls: ['../../list-page.scss', './monthly-limit-list.scss'],
})
export class MonthlyLimitList implements OnInit {
  private readonly monthlyLimitService = inject(MonthlyLimitService);
  private readonly notificationService = inject(NotificationService);

  readonly limits = signal<MonthlyLimit[]>([]);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);

  readonly modalOpen = signal(false);
  readonly editingLimit = signal<MonthlyLimit | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly limitPendingDelete = signal<MonthlyLimit | null>(null);

  readonly monthName = monthName;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.monthlyLimitService.list().subscribe({
      next: (limits) => {
        this.limits.set(
          [...limits].sort((a, b) => b.year - a.year || b.month - a.month),
        );
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.listError.set(getErrorDetail(err));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingLimit.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(limit: MonthlyLimit): void {
    this.editingLimit.set(limit);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(request: MonthlyLimitRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    const editing = this.editingLimit();

    const operation = editing
      ? this.monthlyLimitService.update(editing.id, request)
      : this.monthlyLimitService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success(editing ? 'Limite atualizado.' : 'Limite criado.');
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  requestDelete(limit: MonthlyLimit): void {
    this.limitPendingDelete.set(limit);
  }

  cancelDelete(): void {
    this.limitPendingDelete.set(null);
  }

  confirmDelete(): void {
    const limit = this.limitPendingDelete();
    if (!limit) {
      return;
    }
    this.monthlyLimitService.delete(limit.id).subscribe({
      next: () => {
        this.limitPendingDelete.set(null);
        this.notificationService.success('Limite excluído.');
        this.load();
      },
      error: (err: unknown) => {
        this.limitPendingDelete.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }
}
