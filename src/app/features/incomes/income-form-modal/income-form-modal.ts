import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Income, IncomeRequest } from '../../../core/models/income.model';
import { RECEIPT_METHODS, RECEIPT_METHOD_LABELS } from '../../../core/models/receipt-method.model';
import { RecurringIncomeRequest } from '../../../core/models/recurring-income.model';
import { defaultDateInMonth, firstDayOfMonth, lastDayOfMonth } from '../../../core/utils/recurrence-date.util';
import { RecurringExpenseFields } from '../../recurring-expenses/recurring-expense-fields/recurring-expense-fields';
import { CurrencyMaskDirective } from '../../../shared/currency-mask/currency-mask.directive';
import { Modal } from '../../../shared/modal/modal';

const NOTES_MAX_LENGTH = 500;

type IncomeType = 'single' | 'recurring';

@Component({
  selector: 'app-income-form-modal',
  imports: [ReactiveFormsModule, Modal, CurrencyMaskDirective, RecurringExpenseFields],
  templateUrl: './income-form-modal.html',
  styleUrl: './income-form-modal.scss',
})
export class IncomeFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  income = input<Income | null>(null);
  categories = input.required<Category[]>();
  defaultMonth = input<number | null>(null);
  defaultYear = input<number | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<IncomeRequest>();
  saveRecurring = output<RecurringIncomeRequest>();
  closed = output<void>();

  readonly receiptMethods = RECEIPT_METHODS;
  readonly receiptMethodLabels = RECEIPT_METHOD_LABELS;
  readonly notesMaxLength = NOTES_MAX_LENGTH;

  readonly incomeType = signal<IncomeType>('single');
  readonly endDateError = signal<string | null>(null);

  readonly isEditMode = computed(() => !!this.income());
  readonly title = computed(() => (this.isEditMode() ? 'Editar receita' : 'Nova receita'));
  readonly hasCategories = computed(() => this.categories().length > 0);

  private readonly now = new Date();

  readonly form = this.fb.nonNullable.group({
    categoryId: ['' as number | string, [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    incomeDate: ['', [Validators.required]],
    receiptMethod: ['' as string, [Validators.required]],
    notes: ['', [Validators.maxLength(NOTES_MAX_LENGTH)]],
    receiptDay: [null as number | null, [Validators.min(1), Validators.max(31)]],
    startMonth: [this.now.getMonth() + 1],
    startYear: [this.now.getFullYear()],
    endType: ['none' as 'none' | 'specific'],
    endMonth: [null as number | null],
    endYear: [null as number | null],
  });

  ngOnInit(): void {
    const income = this.income();
    if (!income) {
      const month = this.defaultMonth();
      const year = this.defaultYear();
      if (month != null && year != null) {
        this.form.controls.incomeDate.setValue(defaultDateInMonth(year, month));
      }
      return;
    }
    this.form.patchValue({
      categoryId: income.category.id,
      description: income.description,
      amount: income.amount,
      incomeDate: income.incomeDate,
      receiptMethod: income.receiptMethod,
      notes: income.notes ?? '',
    });
  }

  submit(): void {
    if (this.incomeType() === 'recurring' && !this.isEditMode()) {
      this.submitRecurring();
    } else {
      this.submitSingle();
    }
  }

  private submitSingle(): void {
    const controls = [
      this.form.controls.categoryId,
      this.form.controls.description,
      this.form.controls.amount,
      this.form.controls.incomeDate,
      this.form.controls.receiptMethod,
      this.form.controls.notes,
    ];
    if (controls.some((control) => control.invalid)) {
      controls.forEach((control) => control.markAsTouched());
      return;
    }
    const { categoryId, description, amount, incomeDate, receiptMethod, notes } = this.form.getRawValue();
    this.save.emit({
      categoryId: Number(categoryId),
      description,
      amount: Number(amount),
      incomeDate,
      receiptMethod: receiptMethod as IncomeRequest['receiptMethod'],
      notes: notes || null,
    });
  }

  private submitRecurring(): void {
    this.endDateError.set(null);
    const controls = [
      this.form.controls.categoryId,
      this.form.controls.description,
      this.form.controls.amount,
      this.form.controls.receiptMethod,
      this.form.controls.notes,
      this.form.controls.receiptDay,
    ];
    if (controls.some((control) => control.invalid)) {
      controls.forEach((control) => control.markAsTouched());
      return;
    }

    const value = this.form.getRawValue();
    const startDate = firstDayOfMonth(value.startYear, value.startMonth);

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

    this.saveRecurring.emit({
      categoryId: Number(value.categoryId),
      description: value.description,
      amount: Number(value.amount),
      receiptMethod: value.receiptMethod as RecurringIncomeRequest['receiptMethod'],
      notes: value.notes || null,
      frequency: 'MONTHLY',
      receiptDay: value.receiptDay ? Number(value.receiptDay) : null,
      startDate,
      endDate,
    });
  }
}
