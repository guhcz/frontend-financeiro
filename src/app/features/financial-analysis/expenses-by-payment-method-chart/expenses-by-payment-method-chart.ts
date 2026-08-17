import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { PaymentMethodExpense } from '../../../core/models/financial-analysis.model';
import { paymentMethodLabel } from '../../../core/utils/payment-method-label.util';

interface PaymentMethodBar {
  key: string;
  label: string;
  amount: number;
  percentage: number;
  widthPct: number;
  color: string;
}

const BAR_COLORS = ['#8b5cf6', '#fb4267', '#ff8a33', '#49bf8b', '#3a94e8', '#9ca3af'];

@Component({
  selector: 'app-expenses-by-payment-method-chart',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './expenses-by-payment-method-chart.html',
  styleUrl: './expenses-by-payment-method-chart.scss',
})
export class ExpensesByPaymentMethodChart {
  data = input.required<PaymentMethodExpense[]>();
  loading = input(false);

  viewDetails = output<void>();

  readonly bars = computed<PaymentMethodBar[]>(() => {
    const items = this.data();
    const max = Math.max(...items.map((item) => item.amount), 1);
    return items.map((item, index) => ({
      key: `${item.transactionMethodId}-${item.cardMode ?? ''}`,
      label: paymentMethodLabel(item),
      amount: item.amount,
      percentage: item.percentage,
      widthPct: (item.amount / max) * 100,
      color: BAR_COLORS[index % BAR_COLORS.length],
    }));
  });
}
