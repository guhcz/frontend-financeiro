import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { monthName } from '../../../core/constants/months';
import { Category } from '../../../core/models/category.model';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../core/models/payment-method.model';
import { RecurringExpense, RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import { firstDayOfMonth, lastDayOfMonth } from '../../../core/utils/recurrence-date.util';
import { CurrencyMaskDirective } from '../../../shared/currency-mask/currency-mask.directive';
import { Modal } from '../../../shared/modal/modal';
import { RecurringExpenseFields } from '../recurring-expense-fields/recurring-expense-fields';

const NOTES_MAX_LENGTH = 500;

@Component({
  selector: 'app-recurring-expense-form-modal',
  imports: [ReactiveFormsModule, Modal, CurrencyMaskDirective, RecurringExpenseFields],
  templateUrl: './recurring-expense-form-modal.html',
  styleUrl: './recurring-expense-form-modal.scss',
})
export class RecurringExpenseFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  rule = input<RecurringExpense | null>(null);
  categories = input.required<Category[]>();
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<RecurringExpenseRequest>();
  closed = output<void>();

  readonly paymentMethods = PAYMENT_METHODS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly notesMaxLength = NOTES_MAX_LENGTH;

  readonly isEditMode = computed(() => !!this.rule());
  readonly title = computed(() => (this.isEditMode() ? 'Editar despesa fixa' : 'Nova despesa fixa'));
  readonly hasCategories = computed(() => this.categories().length > 0);

  readonly existingStartDateLabel = computed(() => {
    const rule = this.rule();
    if (!rule) {
      return null;
    }
    const date = new Date(rule.startDate + 'T00:00:00');
    return `${monthName(date.getMonth() + 1)} de ${date.getFullYear()}`;
  });

  readonly endDateError = signal<string | null>(null);

  private readonly now = new Date();

  readonly form = this.fb.nonNullable.group({
    categoryId: ['' as number | string, [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['' as string, [Validators.required]],
    notes: ['', [Validators.maxLength(NOTES_MAX_LENGTH)]],
    dueDay: [null as number | null, [Validators.min(1), Validators.max(31)]],
    startMonth: [this.now.getMonth() + 1],
    startYear: [this.now.getFullYear()],
    endType: ['none' as 'none' | 'specific'],
    endMonth: [null as number | null],
    endYear: [null as number | null],
  });

  ngOnInit(): void {
    const rule = this.rule();
    if (!rule) {
      return;
    }
    this.form.patchValue({
      categoryId: rule.category.id,
      description: rule.description,
      amount: rule.amount,
      paymentMethod: rule.paymentMethod,
      notes: rule.notes ?? '',
      dueDay: rule.dueDay ?? null,
      endType: rule.endDate ? 'specific' : 'none',
      endMonth: this.initialEndMonth(),
      endYear: this.initialEndYear(),
    });
  }

  submit(): void {
    this.endDateError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const rule = this.rule();
    const startDate = rule ? rule.startDate : firstDayOfMonth(value.startYear, value.startMonth);

    let endDate: string | null = null;
    if (value.endType === 'specific') {
      if (!value.endMonth || !value.endYear) {
        this.endDateError.set('Informe o mês e o ano de término.');
        return;
      }
      endDate = lastDayOfMonth(value.endYear, value.endMonth);
      if (endDate < startDate) {
        this.endDateError.set('A data de término não pode ser anterior à data de início.');
        return;
      }
    }

    this.save.emit({
      categoryId: Number(value.categoryId),
      description: value.description,
      amount: Number(value.amount),
      paymentMethod: value.paymentMethod as RecurringExpenseRequest['paymentMethod'],
      notes: value.notes || null,
      frequency: 'MONTHLY',
      dueDay: value.dueDay ? Number(value.dueDay) : null,
      startDate,
      endDate,
    });
  }

  private initialEndMonth(): number | null {
    const endDate = this.rule()?.endDate;
    return endDate ? new Date(endDate + 'T00:00:00').getMonth() + 1 : null;
  }

  private initialEndYear(): number | null {
    const endDate = this.rule()?.endDate;
    return endDate ? new Date(endDate + 'T00:00:00').getFullYear() : null;
  }
}
