import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  PaymentMethodAnalysisItem,
  PaymentMethodAnalysisPage,
} from '../../../core/models/financial-analysis.model';
import {
  CARD_TRANSACTION_MODE_LABELS,
  CardTransactionMode,
  TRANSACTION_METHOD_TYPE_LABELS,
  TransactionMethodType,
} from '../../../core/models/transaction-method.model';
import { FinancialAnalysisService } from '../../../core/services/financial-analysis.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/modal/modal';
import { Pagination } from '../../../shared/pagination/pagination';

const DEFAULT_SIZE = 10;

interface SortOption {
  value: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'amount,desc', label: 'Maior valor' },
  { value: 'amount,asc', label: 'Menor valor' },
  { value: 'transactionCount,desc', label: 'Mais transações' },
  { value: 'name,asc', label: 'Nome (A-Z)' },
];

const TYPE_OPTIONS: { value: TransactionMethodType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  ...(Object.entries(TRANSACTION_METHOD_TYPE_LABELS) as [TransactionMethodType, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

interface PaymentMethodRow {
  transactionMethodId: number;
  cardMode: CardTransactionMode | null;
  name: string;
  cardModeLabel: string | null;
  typeLabel: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

@Component({
  selector: 'app-payment-method-details-modal',
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, Modal, Pagination],
  templateUrl: './payment-method-details-modal.html',
  styleUrl: './payment-method-details-modal.scss',
})
export class PaymentMethodDetailsModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly financialAnalysisService = inject(FinancialAnalysisService);

  startDate = input.required<string>();
  endDate = input.required<string>();
  totalPeriodAmount = input<number>(0);
  closed = output<void>();

  readonly sortOptions = SORT_OPTIONS;
  readonly typeOptions = TYPE_OPTIONS;

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    type: [''],
    sort: ['amount,desc'],
  });

  private readonly pageNumber = signal(0);
  private readonly pageSize = signal(DEFAULT_SIZE);

  readonly page = signal<PaymentMethodAnalysisPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly rows = computed<PaymentMethodRow[]>(() => (this.page()?.content ?? []).map((item) => this.toRow(item)));

  readonly footerPercentage = computed(() => {
    const total = this.totalPeriodAmount();
    const amount = this.page()?.totalAmount ?? 0;
    return total > 0 ? (amount / total) * 100 : 0;
  });

  ngOnInit(): void {
    this.fetch();

    this.filterForm.controls.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageNumber.set(0);
      this.fetch();
    });

    this.filterForm.controls.type.valueChanges.subscribe(() => {
      this.pageNumber.set(0);
      this.fetch();
    });

    this.filterForm.controls.sort.valueChanges.subscribe(() => {
      this.pageNumber.set(0);
      this.fetch();
    });
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.fetch();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(0);
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    const value = this.filterForm.getRawValue();
    this.financialAnalysisService
      .getPaymentMethodDetails({
        startDate: this.startDate(),
        endDate: this.endDate(),
        search: value.search || undefined,
        type: (value.type as TransactionMethodType) || undefined,
        sort: value.sort,
        page: this.pageNumber(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(getErrorDetail(err));
          this.loading.set(false);
        },
      });
  }

  private toRow(item: PaymentMethodAnalysisItem): PaymentMethodRow {
    const cardModeLabel = item.cardMode ? CARD_TRANSACTION_MODE_LABELS[item.cardMode] : null;
    const typeLabel = cardModeLabel
      ? `${TRANSACTION_METHOD_TYPE_LABELS[item.methodType]} • ${cardModeLabel}`
      : TRANSACTION_METHOD_TYPE_LABELS[item.methodType];
    return {
      transactionMethodId: item.transactionMethodId,
      cardMode: item.cardMode,
      name: item.name,
      cardModeLabel,
      typeLabel,
      amount: item.amount,
      percentage: item.percentage,
      transactionCount: item.transactionCount,
    };
  }
}
