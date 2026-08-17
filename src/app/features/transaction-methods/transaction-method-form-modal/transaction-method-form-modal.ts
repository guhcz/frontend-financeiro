import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TRANSACTION_METHOD_TYPE_LABELS,
  TRANSACTION_METHOD_TYPES,
  TransactionMethod,
  TransactionMethodCreateRequest,
  TransactionMethodType,
} from '../../../core/models/transaction-method.model';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-transaction-method-form-modal',
  imports: [ReactiveFormsModule, Modal],
  templateUrl: './transaction-method-form-modal.html',
  styleUrl: './transaction-method-form-modal.scss',
})
export class TransactionMethodFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  method = input<TransactionMethod | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<TransactionMethodCreateRequest>();
  closed = output<void>();

  readonly types = TRANSACTION_METHOD_TYPES;
  readonly typeLabels = TRANSACTION_METHOD_TYPE_LABELS;

  readonly isEditMode = computed(() => !!this.method());
  readonly title = computed(() => (this.isEditMode() ? 'Editar forma de pagamento' : 'Nova forma de pagamento'));

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    type: ['' as TransactionMethodType, [Validators.required]],
    closingDay: [null as number | null],
    dueDay: [null as number | null],
  });

  // FormControl values aren't signals; this tick bumps on every type change so the computed()
  // below re-evaluates and can read form.controls.type.value directly.
  private readonly typeTick = signal(0);

  readonly isCardType = computed(() => {
    this.typeTick();
    const method = this.method();
    // Type is immutable after creation, so in edit mode it's always the existing record's type;
    // in create mode it follows whatever the user just picked in the form.
    return method ? method.type === 'CARD' : this.form.controls.type.value === 'CARD';
  });

  ngOnInit(): void {
    const method = this.method();
    this.form.controls.type.valueChanges.subscribe((type) => {
      this.typeTick.update((n) => n + 1);
      this.applyCardValidators(type === 'CARD');
    });

    if (!method) {
      return;
    }
    this.form.patchValue({
      name: method.name,
      type: method.type,
      closingDay: method.card?.closingDay ?? null,
      dueDay: method.card?.dueDay ?? null,
    });
    this.form.controls.type.disable();
    this.applyCardValidators(method.type === 'CARD');
  }

  private applyCardValidators(isCard: boolean): void {
    const validators = isCard ? [Validators.required, Validators.min(1), Validators.max(31)] : [];
    this.form.controls.closingDay.setValidators(validators);
    this.form.controls.dueDay.setValidators(validators);
    this.form.controls.closingDay.updateValueAndValidity({ emitEvent: false });
    this.form.controls.dueDay.updateValueAndValidity({ emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, type, closingDay, dueDay } = this.form.getRawValue();
    const isCard = type === 'CARD';
    this.save.emit({
      name,
      type,
      card: isCard ? { closingDay: Number(closingDay), dueDay: Number(dueDay) } : null,
    });
  }
}
