import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MONTH_NAMES, monthName } from '../../../core/constants/months';
import { MonthlyLimit, MonthlyLimitRequest } from '../../../core/models/monthly-limit.model';
import { CurrencyMaskDirective } from '../../../shared/currency-mask/currency-mask.directive';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-monthly-limit-form-modal',
  imports: [ReactiveFormsModule, Modal, LucideAngularModule, CurrencyMaskDirective],
  templateUrl: './monthly-limit-form-modal.html',
  styleUrl: './monthly-limit-form-modal.scss',
})
export class MonthlyLimitFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  limit = input<MonthlyLimit | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);
  periodLocked = input(false);
  defaultMonth = input<number | null>(null);
  defaultYear = input<number | null>(null);

  save = output<MonthlyLimitRequest>();
  closed = output<void>();

  readonly months = MONTH_NAMES.map((name, index) => ({ value: index + 1, name }));
  readonly years = signal<number[]>(this.buildYearOptions(new Date().getFullYear()));
  readonly monthName = monthName;

  readonly isEditMode = computed(() => !!this.limit());
  readonly title = computed(() => (this.isEditMode() ? 'Editar limite mensal' : 'Definir limite mensal'));
  readonly saveLabel = computed(() => (this.isEditMode() ? 'Salvar alterações' : 'Salvar limite'));

  readonly form = this.fb.nonNullable.group({
    month: [new Date().getMonth() + 1, [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    const limit = this.limit();
    if (limit) {
      this.years.set(this.buildYearOptions(limit.year));
      this.form.patchValue({ month: limit.month, year: limit.year, amount: limit.amount });
      return;
    }
    const month = this.defaultMonth();
    const year = this.defaultYear();
    if (month != null) {
      this.form.controls.month.setValue(month);
    }
    if (year != null) {
      this.years.set(this.buildYearOptions(year));
      this.form.controls.year.setValue(year);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { month, year, amount } = this.form.getRawValue();
    this.save.emit({ month: Number(month), year: Number(year), amount: Number(amount) });
  }

  private buildYearOptions(referenceYear: number): number[] {
    const currentYear = new Date().getFullYear();
    const start = Math.min(currentYear - 2, referenceYear);
    return Array.from({ length: 8 }, (_, i) => start + i);
  }
}
