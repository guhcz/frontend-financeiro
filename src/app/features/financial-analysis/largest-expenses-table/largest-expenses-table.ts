import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { LargestExpense } from '../../../core/models/financial-analysis.model';
import { paymentMethodLabel } from '../../../core/utils/payment-method-label.util';
import { TransactionMethodType } from '../../../core/models/transaction-method.model';

interface LargestExpenseRow {
  id: number;
  description: string;
  categoryName: string;
  categoryColor: string;
  methodLabel: string;
  date: string;
  amount: number;
}

@Component({
  selector: 'app-largest-expenses-table',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './largest-expenses-table.html',
  styleUrl: './largest-expenses-table.scss',
})
export class LargestExpensesTable {
  data = input.required<LargestExpense[]>();
  loading = input(false);

  viewAll = output<void>();

  readonly rows = computed<LargestExpenseRow[]>(() =>
    this.data().map((item) => ({
      id: item.id,
      description: item.description,
      categoryName: item.category.name,
      categoryColor: item.category.color,
      methodLabel: paymentMethodLabel({
        name: item.transactionMethod.name,
        methodType: item.transactionMethod.type as TransactionMethodType,
        cardMode: item.cardMode,
      }),
      date: item.date,
      amount: item.amount,
    })),
  );
}
