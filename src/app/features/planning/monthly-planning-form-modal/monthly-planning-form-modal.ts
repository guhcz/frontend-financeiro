import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Category } from '../../../core/models/category.model';
import { MonthlyPlanningItem, MonthlyPlanningRequest } from '../../../core/models/monthly-planning.model';
import { CurrencyMaskDirective } from '../../../shared/currency-mask/currency-mask.directive';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-monthly-planning-form-modal',
  imports: [ReactiveFormsModule, Modal, LucideAngularModule, CurrencyMaskDirective],
  templateUrl: './monthly-planning-form-modal.html',
  styleUrl: './monthly-planning-form-modal.scss',
})
export class MonthlyPlanningFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  planning = input<MonthlyPlanningItem | null>(null);
  categories = input<Category[]>([]);
  month = input.required<number>();
  year = input.required<number>();
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<MonthlyPlanningRequest>();
  closed = output<void>();

  readonly isEditMode = computed(() => !!this.planning());
  readonly title = computed(() => (this.isEditMode() ? 'Editar planejamento' : 'Adicionar planejamento'));
  readonly saveLabel = computed(() => (this.isEditMode() ? 'Salvar alterações' : 'Adicionar planejamento'));

  readonly form = this.fb.nonNullable.group({
    categoryId: [null as number | null, [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    const planning = this.planning();
    if (!planning) {
      return;
    }
    this.form.patchValue({
      categoryId: planning.category.id,
      amount: planning.plannedAmount,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { categoryId, amount } = this.form.getRawValue();
    this.save.emit({
      categoryId: Number(categoryId),
      month: this.month(),
      year: this.year(),
      amount: Number(amount),
    });
  }
}
