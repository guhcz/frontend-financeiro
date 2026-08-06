import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MONTH_NAMES } from '../../../core/constants/months';
import { RECURRENCE_FREQUENCIES, RECURRENCE_FREQUENCY_LABELS } from '../../../core/models/recurrence-frequency.model';

@Component({
  selector: 'app-recurring-expense-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './recurring-expense-fields.html',
  styleUrl: './recurring-expense-fields.scss',
})
export class RecurringExpenseFields {
  dueDayControl = input.required<FormControl<number | null>>();
  startMonthControl = input.required<FormControl<number>>();
  startYearControl = input.required<FormControl<number>>();
  endTypeControl = input.required<FormControl<'none' | 'specific'>>();
  endMonthControl = input.required<FormControl<number | null>>();
  endYearControl = input.required<FormControl<number | null>>();
  mode = input<'create' | 'edit'>('create');
  existingStartDateLabel = input<string | null>(null);
  endDateError = input<string | null>(null);

  readonly frequencies = RECURRENCE_FREQUENCIES;
  readonly frequencyLabels = RECURRENCE_FREQUENCY_LABELS;
  readonly months = MONTH_NAMES.map((name, index) => ({ value: index + 1, name }));
  readonly years = this.buildYearOptions();

  private buildYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 1 + i);
  }
}
