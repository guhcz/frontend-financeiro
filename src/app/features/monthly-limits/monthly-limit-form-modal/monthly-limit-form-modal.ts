import { Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MONTH_NAMES } from '../../../core/constants/months';
import { MonthlyLimit, MonthlyLimitRequest } from '../../../core/models/monthly-limit.model';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-monthly-limit-form-modal',
  imports: [ReactiveFormsModule, Modal],
  templateUrl: './monthly-limit-form-modal.html',
  styleUrl: './monthly-limit-form-modal.scss',
})
export class MonthlyLimitFormModal {
  private readonly fb = inject(FormBuilder);

  limit = input<MonthlyLimit | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<MonthlyLimitRequest>();
  closed = output<void>();

  readonly months = MONTH_NAMES.map((name, index) => ({ value: index + 1, name }));
  readonly years = this.buildYearOptions();

  readonly isEditMode = computed(() => !!this.limit());
  readonly title = computed(() => (this.isEditMode() ? 'Editar limite' : 'Novo limite'));

  readonly form = this.fb.nonNullable.group({
    month: [this.limit()?.month ?? new Date().getMonth() + 1, [Validators.required]],
    year: [this.limit()?.year ?? new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    amount: [this.limit()?.amount ?? null, [Validators.required, Validators.min(0.01)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { month, year, amount } = this.form.getRawValue();
    this.save.emit({ month: Number(month), year: Number(year), amount: Number(amount) });
  }

  private buildYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const start = Math.min(currentYear - 2, this.limit()?.year ?? currentYear);
    return Array.from({ length: 8 }, (_, i) => start + i);
  }
}
