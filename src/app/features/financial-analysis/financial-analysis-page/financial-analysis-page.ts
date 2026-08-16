import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { FinancialAnalysisResponse } from '../../../core/models/financial-analysis.model';
import { FinancialAnalysisService } from '../../../core/services/financial-analysis.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ExpensesByCategoryChart } from '../expenses-by-category-chart/expenses-by-category-chart';
import { ExpensesByPaymentMethodChart } from '../expenses-by-payment-method-chart/expenses-by-payment-method-chart';
import { IncomeExpenseChart } from '../income-expense-chart/income-expense-chart';
import { LargestExpensesTable } from '../largest-expenses-table/largest-expenses-table';
import { MonthlyBalanceChart } from '../monthly-balance-chart/monthly-balance-chart';
import { PaymentMethodDetailsModal } from '../payment-method-details-modal/payment-method-details-modal';
import { PeriodFilter, PeriodRange, PeriodShortcutKey, shortcutRange } from '../period-filter/period-filter';

const DEFAULT_SHORTCUT_MONTHS_BACK = 2;

@Component({
  selector: 'app-financial-analysis-page',
  imports: [
    LucideAngularModule,
    PeriodFilter,
    IncomeExpenseChart,
    ExpensesByCategoryChart,
    ExpensesByPaymentMethodChart,
    MonthlyBalanceChart,
    LargestExpensesTable,
    PaymentMethodDetailsModal,
  ],
  templateUrl: './financial-analysis-page.html',
  styleUrls: ['../../list-page.scss', './financial-analysis-page.scss'],
})
export class FinancialAnalysisPage implements OnInit {
  private readonly financialAnalysisService = inject(FinancialAnalysisService);
  private readonly router = inject(Router);

  private readonly defaultRange = shortcutRange(DEFAULT_SHORTCUT_MONTHS_BACK);
  readonly startDate = signal(this.defaultRange.startDate);
  readonly endDate = signal(this.defaultRange.endDate);
  readonly activeShortcut = signal<PeriodShortcutKey | null>('3m');

  readonly analysis = signal<FinancialAnalysisResponse | null>(null);
  readonly analysisLoading = signal(true);
  readonly analysisError = signal<string | null>(null);

  readonly totalExpenseAmount = computed(() =>
    (this.analysis()?.expensesByPaymentMethod ?? []).reduce((sum, item) => sum + item.amount, 0),
  );

  readonly paymentMethodModalOpen = signal(false);

  ngOnInit(): void {
    this.loadAnalysis();
  }

  onPeriodApplied(range: PeriodRange & { shortcut: PeriodShortcutKey | null }): void {
    this.startDate.set(range.startDate);
    this.endDate.set(range.endDate);
    this.activeShortcut.set(range.shortcut);
    this.loadAnalysis();
  }

  openPaymentMethodDetails(): void {
    this.paymentMethodModalOpen.set(true);
  }

  closePaymentMethodDetails(): void {
    this.paymentMethodModalOpen.set(false);
  }

  goToTransactions(): void {
    this.router.navigate(['/movimentacoes'], {
      queryParams: { startDate: this.startDate(), endDate: this.endDate() },
    });
  }

  goToRegistrations(): void {
    this.router.navigate(['/cadastros']);
  }

  private loadAnalysis(): void {
    this.analysisLoading.set(true);
    this.analysisError.set(null);
    this.financialAnalysisService.getAnalysis(this.startDate(), this.endDate()).subscribe({
      next: (data) => {
        this.analysis.set(data);
        this.analysisLoading.set(false);
      },
      error: (err: unknown) => {
        const isServerOrNetwork = err instanceof HttpErrorResponse && (err.status === 0 || err.status >= 500);
        this.analysisError.set(
          isServerOrNetwork ? 'Não foi possível carregar a análise financeira. Tente novamente.' : getErrorDetail(err),
        );
        this.analysisLoading.set(false);
      },
    });
  }
}
