import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CreditCard, CreditCardRequest } from '../../../core/models/credit-card.model';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-credit-card-manage-modal',
  imports: [ReactiveFormsModule, Modal, EmptyState, ConfirmDialog, LucideAngularModule],
  templateUrl: './credit-card-manage-modal.html',
  styleUrl: './credit-card-manage-modal.scss',
})
export class CreditCardManageModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly creditCardService = inject(CreditCardService);
  private readonly notificationService = inject(NotificationService);

  closed = output<void>();
  changed = output<void>();

  readonly cards = signal<CreditCard[]>([]);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);

  readonly formOpen = signal(false);
  readonly editingCard = signal<CreditCard | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly pendingDelete = signal<CreditCard | null>(null);
  readonly deleteError = signal<string | null>(null);

  readonly isEditMode = computed(() => !!this.editingCard());
  readonly formTitle = computed(() => (this.isEditMode() ? 'Editar cartão' : 'Novo cartão'));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    closingDay: [null as number | null, [Validators.required, Validators.min(1), Validators.max(31)]],
    dueDay: [null as number | null, [Validators.required, Validators.min(1), Validators.max(31)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.creditCardService.list().subscribe({
      next: (cards) => {
        this.cards.set(cards);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.listError.set(getErrorDetail(err));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingCard.set(null);
    this.saveError.set(null);
    this.form.reset({ name: '', closingDay: null, dueDay: null });
    this.formOpen.set(true);
  }

  openEdit(card: CreditCard): void {
    this.editingCard.set(card);
    this.saveError.set(null);
    this.form.reset({ name: card.name, closingDay: card.closingDay, dueDay: card.dueDay });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, closingDay, dueDay } = this.form.getRawValue();
    const request: CreditCardRequest = { name, closingDay: Number(closingDay), dueDay: Number(dueDay) };
    const editing = this.editingCard();

    this.saving.set(true);
    this.saveError.set(null);
    const operation = editing ? this.creditCardService.update(editing.id, request) : this.creditCardService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.notificationService.success(editing ? 'Cartão atualizado com sucesso.' : 'Cartão criado com sucesso.');
        this.load();
        this.changed.emit();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  requestDelete(card: CreditCard): void {
    this.deleteError.set(null);
    this.pendingDelete.set(card);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const card = this.pendingDelete();
    if (!card) {
      return;
    }
    this.creditCardService.delete(card.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.notificationService.success('Cartão excluído com sucesso.');
        this.load();
        this.changed.emit();
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.deleteError.set(getErrorDetail(err));
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }
}
