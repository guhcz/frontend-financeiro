import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { monthName } from '../../../core/constants/months';
import { CreditCard } from '../../../core/models/credit-card.model';
import { MonthlyCardPlanningItem, MonthlyCardPlanningRequest } from '../../../core/models/monthly-card-planning.model';
import { CurrencyMaskDirective } from '../../../shared/currency-mask/currency-mask.directive';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-credit-card-planning-form-modal',
  imports: [ReactiveFormsModule, Modal, LucideAngularModule, CurrencyMaskDirective],
  templateUrl: './credit-card-planning-form-modal.html',
  styleUrl: './credit-card-planning-form-modal.scss',
})
export class CreditCardPlanningFormModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  planning = input<MonthlyCardPlanningItem | null>(null);
  creditCards = input<CreditCard[]>([]);
  month = input.required<number>();
  year = input.required<number>();
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<MonthlyCardPlanningRequest>();
  closed = output<void>();
  manageCards = output<void>();

  readonly isEditMode = computed(() => !!this.planning());
  readonly title = computed(() => (this.isEditMode() ? 'Editar planejamento de cartão' : 'Planejar cartão'));
  readonly saveLabel = computed(() => (this.isEditMode() ? 'Salvar alterações' : 'Adicionar planejamento'));
  readonly hasCreditCards = computed(() => this.creditCards().length > 0);

  readonly form = this.fb.nonNullable.group({
    creditCardId: [null as number | null, [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  readonly monthName = monthName;

  ngOnInit(): void {
    const planning = this.planning();
    if (!planning) {
      return;
    }
    this.form.patchValue({
      creditCardId: planning.creditCard.id,
      amount: planning.plannedAmount,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { creditCardId, amount } = this.form.getRawValue();
    this.save.emit({
      creditCardId: Number(creditCardId),
      month: this.month(),
      year: this.year(),
      amount: Number(amount),
    });
  }
}
