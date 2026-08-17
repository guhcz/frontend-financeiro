import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Expense, ExpenseRequest } from '../../../core/models/expense.model';
import { RecurringExpenseRequest } from '../../../core/models/recurring-expense.model';
import {
  CARD_TRANSACTION_MODE_LABELS,
  CardTransactionMode,
  TransactionMethod,
} from '../../../core/models/transaction-method.model';
import {
  calculateInstallmentAmount,
  firstDayOfMonth,
  lastDayOfMonth,
  lastInstallmentMonth,
} from '../../../core/utils/recurrence-date.util';
import { monthName } from '../../../core/constants/months';
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
  transactionMethods = input<TransactionMethod[]>([]);
  defaultMonth = input<number | null>(null);
  defaultYear = input<number | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<ExpenseRequest>();
  saveRecurring = output<RecurringExpenseRequest>();
  closed = output<void>();

  readonly notesMaxLength = NOTES_MAX_LENGTH;
  readonly cardTransactionModes: CardTransactionMode[] = ['CREDIT', 'DEBIT'];
  readonly cardTransactionModeLabels = CARD_TRANSACTION_MODE_LABELS;

  readonly expenseType = signal<ExpenseType>('single');
  readonly endDateError = signal<string | null>(null);
  readonly valueMode = signal<'monthly' | 'installments'>('monthly');
  readonly installmentError = signal<string | null>(null);

  readonly isEditMode = computed(() => !!this.expense());
  readonly title = computed(() => (this.isEditMode() ? 'Editar despesa' : 'Nova despesa'));
  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly hasTransactionMethods = computed(() => this.transactionMethods().length > 0);
  readonly cardMethods = computed(() => this.transactionMethods().filter((m) => m.type === 'CARD'));
  readonly otherMethods = computed(() => this.transactionMethods().filter((m) => m.type !== 'CARD'));

  private readonly now = new Date();

  readonly form = this.fb.nonNullable.group({
    categoryId: ['' as number | string, [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expenseDate: ['', [Validators.required]],
    transactionMethodId: [null as number | null, [Validators.required]],
    cardTransactionMode: [null as CardTransactionMode | null],
    notes: ['', [Validators.maxLength(NOTES_MAX_LENGTH)]],
    dueDay: [null as number | null, [Validators.min(1), Validators.max(31)]],
    startMonth: [this.now.getMonth() + 1],
    startYear: [this.now.getFullYear()],
    endType: ['none' as 'none' | 'specific'],
    endMonth: [null as number | null],
    endYear: [null as number | null],
    totalAmount: [null as number | null],
    installments: [null as number | null],
  });

  // FormControl values aren't signals; this tick bumps on every form change so the computed()
  // below re-evaluates and can read form.controls.transactionMethodId.value directly.
  private readonly formTick = signal(0);

  readonly isCardMethod = computed(() => {
    this.formTick();
    const id = this.form.controls.transactionMethodId.value;
    return this.transactionMethods().find((m) => m.id === Number(id))?.type === 'CARD';
  });

  readonly installmentPreview = computed(() => {
    this.formTick();
    const { totalAmount, installments, startMonth, startYear } = this.form.getRawValue();
    if (!totalAmount || totalAmount <= 0 || !installments || installments < 1) {
      return null;
    }
    const perInstallment = calculateInstallmentAmount(totalAmount, installments);
    const last = lastInstallmentMonth(startYear, startMonth, installments);
    return {
      amountLabel: perInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      lastMonthLabel: `${monthName(last.month)}/${last.year}`,
    };
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.formTick.update((n) => n + 1));
    this.form.controls.transactionMethodId.valueChanges.subscribe((id) => {
      const cardModeControl = this.form.controls.cardTransactionMode;
      const isCard = this.transactionMethods().find((m) => m.id === Number(id))?.type === 'CARD';
      if (isCard) {
        cardModeControl.setValidators([Validators.required]);
      } else {
        cardModeControl.clearValidators();
        cardModeControl.setValue(null);
      }
      cardModeControl.updateValueAndValidity({ emitEvent: false });
    });

    const expense = this.expense();
    if (!expense) {
      return;
    }
    this.form.patchValue({
      categoryId: expense.category.id,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      transactionMethodId: expense.transactionMethod.id,
      cardTransactionMode: expense.cardTransactionMode,
      notes: expense.notes ?? '',
    });
    if (expense.transactionMethod.type === 'CARD') {
      this.form.controls.cardTransactionMode.setValidators([Validators.required]);
      this.form.controls.cardTransactionMode.updateValueAndValidity({ emitEvent: false });
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
      this.form.controls.transactionMethodId,
      this.form.controls.cardTransactionMode,
      this.form.controls.notes,
    ];
    if (controls.some((control) => control.invalid)) {
      controls.forEach((control) => control.markAsTouched());
      return;
    }
    const { categoryId, description, amount, expenseDate, transactionMethodId, cardTransactionMode, notes } =
      this.form.getRawValue();
    this.save.emit({
      categoryId: Number(categoryId),
      description,
      amount: Number(amount),
      expenseDate,
      transactionMethodId: Number(transactionMethodId),
      cardTransactionMode: this.isCardMethod() ? cardTransactionMode : null,
      notes: notes || null,
    });
  }

  private submitFixed(): void {
    this.endDateError.set(null);
    this.installmentError.set(null);
    const isInstallments = this.valueMode() === 'installments';

    const controls = [
      this.form.controls.categoryId,
      this.form.controls.description,
      this.form.controls.transactionMethodId,
      this.form.controls.cardTransactionMode,
      this.form.controls.notes,
      this.form.controls.dueDay,
      ...(isInstallments ? [] : [this.form.controls.amount]),
    ];
    if (controls.some((control) => control.invalid)) {
      controls.forEach((control) => control.markAsTouched());
      return;
    }

    const value = this.form.getRawValue();
    const startDate = firstDayOfMonth(value.startYear, value.startMonth);

    let amount: number;
    let endDate: string | null = null;

    if (isInstallments) {
      if (!value.totalAmount || value.totalAmount <= 0) {
        this.installmentError.set('Informe o valor total da compra.');
        return;
      }
      if (!value.installments || value.installments < 1) {
        this.installmentError.set('Informe em quantas parcelas a compra foi dividida.');
        return;
      }
      amount = calculateInstallmentAmount(value.totalAmount, value.installments);
      const last = lastInstallmentMonth(value.startYear, value.startMonth, value.installments);
      endDate = lastDayOfMonth(last.year, last.month);
    } else {
      amount = Number(value.amount);
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
    }

    this.saveRecurring.emit({
      categoryId: Number(value.categoryId),
      description: value.description,
      amount,
      transactionMethodId: Number(value.transactionMethodId),
      cardTransactionMode: this.isCardMethod() ? value.cardTransactionMode : null,
      notes: value.notes || null,
      frequency: 'MONTHLY',
      dueDay: value.dueDay ? Number(value.dueDay) : null,
      startDate,
      endDate,
    });
  }
}
