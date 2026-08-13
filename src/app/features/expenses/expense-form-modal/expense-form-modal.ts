import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { CreditCard } from '../../../core/models/credit-card.model';
import { Expense, ExpenseRequest } from '../../../core/models/expense.model';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../core/models/payment-method.model';
import { RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import { defaultDateInMonth, firstDayOfMonth, lastDayOfMonth } from '../../../core/utils/recurrence-date.util';
import { RecurringExpenseFields } from '../../recurring-expenses/recurring-expense-fields/recurring-expense-fields';
import { CurrencyMaskDirective } from '../../../shared/currency-mask/currency-mask.directive';
import { Modal } from '../../../shared/modal/modal';

const NOTES_MAX_LENGTH = 500;

type ExpenseType = 'single' | 'fixed';

@Component({
  selector: 'app-expense-form-modal',
  imports: [ReactiveFormsModule, Modal, CurrencyMaskDirective, RecurringExpenseFields],
  templateUrl: './expense-form-modal.html',
  styleUrl: './expense-form-modal.scss',
})
export class ExpenseFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  expense = input<Expense | null>(null);
  categories = input.required<Category[]>();
  creditCards = input<CreditCard[]>([]);
  defaultMonth = input<number | null>(null);
  defaultYear = input<number | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<ExpenseRequest>();
  saveRecurring = output<RecurringExpenseRequest>();
  closed = output<void>();

  readonly paymentMethods = PAYMENT_METHODS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly notesMaxLength = NOTES_MAX_LENGTH;

  readonly expenseType = signal<ExpenseType>('single');
  readonly endDateError = signal<string | null>(null);

  readonly isEditMode = computed(() => !!this.expense());
  readonly title = computed(() => (this.isEditMode() ? 'Editar despesa' : 'Nova despesa'));
  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly hasCreditCards = computed(() => this.creditCards().length > 0);

  private readonly now = new Date();

  readonly form = this.fb.nonNullable.group({
    categoryId: ['' as number | string, [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expenseDate: ['', [Validators.required]],
    paymentMethod: ['' as string, [Validators.required]],
    creditCardId: [null as number | null],
    notes: ['', [Validators.maxLength(NOTES_MAX_LENGTH)]],
    dueDay: [null as number | null, [Validators.min(1), Validators.max(31)]],
    startMonth: [this.now.getMonth() + 1],
    startYear: [this.now.getFullYear()],
    endType: ['none' as 'none' | 'specific'],
    endMonth: [null as number | null],
    endYear: [null as number | null],
  });

  // FormControl values aren't signals; this tick bumps on every form change so the computed()
  // below re-evaluates and can read form.controls.paymentMethod.value directly.
  private readonly formTick = signal(0);

  readonly isCreditCard = computed(() => {
    this.formTick();
    return this.form.controls.paymentMethod.value === 'CREDIT_CARD';
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
    this.form.controls.paymentMethod.valueChanges.subscribe((method) => {
      const creditCardIdControl = this.form.controls.creditCardId;
      if (method === 'CREDIT_CARD') {
        creditCardIdControl.setValidators([Validators.required]);
      } else {
        creditCardIdControl.clearValidators();
        creditCardIdControl.setValue(null);
      }
      creditCardIdControl.updateValueAndValidity({ emitEvent: false });
    });

    const expense = this.expense();
    if (!expense) {
      const month = this.defaultMonth();
      const year = this.defaultYear();
      if (month != null && year != null) {
        this.form.controls.expenseDate.setValue(defaultDateInMonth(year, month));
      }
      return;
    }
    this.form.patchValue({
      categoryId: expense.category.id,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod,
      creditCardId: expense.creditCard?.id ?? null,
      notes: expense.notes ?? '',
    });
    if (expense.paymentMethod === 'CREDIT_CARD') {
      this.form.controls.creditCardId.setValidators([Validators.required]);
      this.form.controls.creditCardId.updateValueAndValidity({ emitEvent: false });
    }
  }

  submit(): void {
    if (this.expenseType() === 'fixed' && !this.isEditMode()) {
      this.submitFixed();
    } else {
      this.submitSingle();
    }
  }

  private submitSingle(): void {
    const controls = [
      this.form.controls.categoryId,
      this.form.controls.description,
      this.form.controls.amount,
      this.form.controls.expenseDate,
      this.form.controls.paymentMethod,
      this.form.controls.creditCardId,
      this.form.controls.notes,
    ];
    if (controls.some((control) => control.invalid)) {
      controls.forEach((control) => control.markAsTouched());
      return;
    }
    const { categoryId, description, amount, expenseDate, paymentMethod, creditCardId, notes } = this.form.getRawValue();
    this.save.emit({
      categoryId: Number(categoryId),
      description,
      amount: Number(amount),
      expenseDate,
      paymentMethod: paymentMethod as ExpenseRequest['paymentMethod'],
      creditCardId: this.isCreditCard() ? Number(creditCardId) : null,
      notes: notes || null,
    });
  }

  private submitFixed(): void {
    this.endDateError.set(null);
    const controls = [
      this.form.controls.categoryId,
      this.form.controls.description,
      this.form.controls.amount,
      this.form.controls.paymentMethod,
      this.form.controls.creditCardId,
      this.form.controls.notes,
      this.form.controls.dueDay,
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
      paymentMethod: value.paymentMethod as RecurringExpenseRequest['paymentMethod'],
      creditCardId: this.isCreditCard() ? Number(value.creditCardId) : null,
      notes: value.notes || null,
      frequency: 'MONTHLY',
      dueDay: value.dueDay ? Number(value.dueDay) : null,
      startDate,
      endDate,
    });
  }
}
