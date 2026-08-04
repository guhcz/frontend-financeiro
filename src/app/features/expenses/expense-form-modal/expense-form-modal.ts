import { Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Expense, ExpenseRequest } from '../../../core/models/expense.model';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../../core/models/payment-method.model';
import { Modal } from '../../../shared/modal/modal';

const NOTES_MAX_LENGTH = 500;

@Component({
  selector: 'app-expense-form-modal',
  imports: [ReactiveFormsModule, Modal],
  templateUrl: './expense-form-modal.html',
  styleUrl: './expense-form-modal.scss',
})
export class ExpenseFormModal {
  private readonly fb = inject(FormBuilder);

  expense = input<Expense | null>(null);
  categories = input.required<Category[]>();
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<ExpenseRequest>();
  closed = output<void>();

  readonly paymentMethods = PAYMENT_METHODS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly notesMaxLength = NOTES_MAX_LENGTH;

  readonly isEditMode = computed(() => !!this.expense());
  readonly title = computed(() => (this.isEditMode() ? 'Editar despesa' : 'Nova despesa'));
  readonly hasCategories = computed(() => this.categories().length > 0);

  readonly form = this.fb.nonNullable.group({
    categoryId: [this.expense()?.category.id ?? '', [Validators.required]],
    description: [this.expense()?.description ?? '', [Validators.required, Validators.maxLength(255)]],
    amount: [this.expense()?.amount ?? null, [Validators.required, Validators.min(0.01)]],
    expenseDate: [this.expense()?.expenseDate ?? '', [Validators.required]],
    paymentMethod: [this.expense()?.paymentMethod ?? '', [Validators.required]],
    notes: [this.expense()?.notes ?? '', [Validators.maxLength(NOTES_MAX_LENGTH)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { categoryId, description, amount, expenseDate, paymentMethod, notes } = this.form.getRawValue();
    this.save.emit({
      categoryId: Number(categoryId),
      description,
      amount: Number(amount),
      expenseDate,
      paymentMethod: paymentMethod as ExpenseRequest['paymentMethod'],
      notes: notes || null,
    });
  }
}
