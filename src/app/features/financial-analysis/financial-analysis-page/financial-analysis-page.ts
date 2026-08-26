import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Category } from '../../../core/models/category.model';
import { FinancialAnalysisResponse } from '../../../core/models/financial-analysis.model';
import { TransactionListItem } from '../../../core/models/transaction.model';
import { CategoryService } from '../../../core/services/category.service';
import { FinancialAnalysisService } from '../../../core/services/financial-analysis.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ExpensesByCategoryChart } from '../expenses-by-category-chart/expenses-by-category-chart';
import { ExpensesByPaymentMethodChart } from '../expenses-by-payment-method-chart/expenses-by-payment-method-chart';
import { IncomeExpenseChart } from '../income-expense-chart/income-expense-chart';
import { LargestExpensesTable } from '../largest-expenses-table/largest-expenses-table';
import { MonthlyBalanceChart } from '../monthly-balance-chart/monthly-balance-chart';
import { PaymentMethodDetailsModal } from '../payment-method-details-modal/payment-method-details-modal';
import { CategoryDetailsModal } from '../category-details-modal/category-details-modal';
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
    CategoryDetailsModal,
  ],
  templateUrl: './financial-analysis-page.html',
  styleUrls: ['../../list-page.scss', './financial-analysis-page.scss'],
})
export class FinancialAnalysisPage implements OnInit {
  private readonly financialAnalysisService = inject(FinancialAnalysisService);
  private readonly categoryService = inject(CategoryService);
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);

  private readonly defaultRange = shortcutRange(DEFAULT_SHORTCUT_MONTHS_BACK);
  readonly startDate = signal(this.defaultRange.startDate);
  readonly endDate = signal(this.defaultRange.endDate);
  readonly activeShortcut = signal<PeriodShortcutKey | null>('3m');
  readonly incomeExpensePeriod = signal<'monthly' | 'yearly'>('monthly');
  readonly balancePeriod = signal<'monthly' | 'yearly'>('monthly');

  readonly analysis = signal<FinancialAnalysisResponse | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly categoryExpenses = signal<TransactionListItem[] | null>(null);
  readonly categoryExpensesLoading = signal(true);
  readonly analysisLoading = signal(true);
  readonly analysisError = signal<string | null>(null);

  readonly expensesByCategory = computed(() => {
    const transactions = this.categoryExpenses();
    if (transactions) {
      const categoriesById = new Map(this.categories().map((category) => [category.id, category]));
      const amountsByCategoryId = new Map<number, number>();

      for (const transaction of transactions) {
        categoriesById.set(transaction.category.id, transaction.category);
        amountsByCategoryId.set(
          transaction.category.id,
          (amountsByCategoryId.get(transaction.category.id) ?? 0) + transaction.amount,
        );
      }

      const total = [...amountsByCategoryId.values()].reduce((sum, amount) => sum + amount, 0);
      return [...categoriesById.values()]
        .map((category) => {
          const amount = amountsByCategoryId.get(category.id) ?? 0;
          return { category, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
        })
        .sort((a, b) => b.amount - a.amount);
    }

    const expenses = this.analysis()?.expensesByCategory ?? [];
    const expenseCategoryIds = new Set(expenses.map((item) => item.category.id));
    const categoriesWithoutExpenses = this.categories()
      .filter((category) => !expenseCategoryIds.has(category.id))
      .map((category) => ({ category, amount: 0, percentage: 0 }));

    return [...expenses, ...categoriesWithoutExpenses].sort((a, b) => b.amount - a.amount);
  });

  readonly totalExpenseAmount = computed(() =>
    (this.analysis()?.expensesByPaymentMethod ?? []).reduce((sum, item) => sum + item.amount, 0),
  );

  readonly paymentMethodModalOpen = signal(false);
  readonly categoryModalOpen = signal(false);

  ngOnInit(): void {
    this.loadCategories();
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

  openCategoryDetails(): void {
    this.categoryModalOpen.set(true);
  }

  closeCategoryDetails(): void {
    this.categoryModalOpen.set(false);
  }

  onIncomeExpensePeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.incomeExpensePeriod.set(value === 'yearly' ? 'yearly' : 'monthly');
  }

  onBalancePeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.balancePeriod.set(value === 'yearly' ? 'yearly' : 'monthly');
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
    this.categoryExpensesLoading.set(true);
    this.categoryExpenses.set(null);
    this.analysisError.set(null);

    this.transactionService
      .getAllTransactions({
        type: 'EXPENSE',
        startDate: this.startDate(),
        endDate: this.endDate(),
        sort: 'date,desc',
      })
      .subscribe({
        next: (expenses) => {
          this.categoryExpenses.set(expenses);
          this.categoryExpensesLoading.set(false);
        },
        // Mantém os valores por competência da análise como fallback.
        error: () => this.categoryExpensesLoading.set(false),
      });

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

  private loadCategories(): void {
    this.categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      // A falha desta chamada não deve impedir a exibição dos dados analíticos.
      error: () => this.categories.set([]),
    });
  }
}
