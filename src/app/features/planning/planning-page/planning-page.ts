import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Observable, forkJoin } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { MonthlyLimit, MonthlyLimitRequest } from '../../../core/models/monthly-limit.model';
import { MonthlyPlanningItem, MonthlyPlanningRequest } from '../../../core/models/monthly-planning.model';
import { CategoryExpense, ExpenseEvolutionPoint, PlanningSummary } from '../../../core/models/planning.model';
import { Page } from '../../../core/models/page.model';
import { CategoryService } from '../../../core/services/category.service';
import { MonthlyLimitService } from '../../../core/services/monthly-limit.service';
import { MonthlyPlanningService } from '../../../core/services/monthly-planning.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PlanningService } from '../../../core/services/planning.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { MonthPeriod, MonthSwitcher } from '../../../shared/month-switcher/month-switcher';
import { MonthlyLimitFormModal } from '../../monthly-limits/monthly-limit-form-modal/monthly-limit-form-modal';
import { ExpenseEvolutionChart } from '../expense-evolution-chart/expense-evolution-chart';
import { ExpensesByCategoryChart } from '../expenses-by-category-chart/expenses-by-category-chart';
import { MonthlyPlanningFormModal } from '../monthly-planning-form-modal/monthly-planning-form-modal';
import { MonthlyPlanningTable } from '../monthly-planning-table/monthly-planning-table';
import { PlanningSummaryCards } from '../planning-summary-cards/planning-summary-cards';

const DEFAULT_PAGE_SIZE = 5;
const COPY_FETCH_SIZE = 500;
const TIP_DISMISSED_KEY = 'planning-tip-dismissed';

interface CopyPreview {
  month: number;
  year: number;
  limitAmount: number | null;
  items: { categoryId: number; amount: number }[];
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthYearLabel(month: number, year: number): string {
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

@Component({
  selector: 'app-planning-page',
  imports: [
    PlanningSummaryCards,
    MonthlyPlanningTable,
    MonthlyPlanningFormModal,
    MonthlyLimitFormModal,
    ExpensesByCategoryChart,
    ExpenseEvolutionChart,
    ConfirmDialog,
    LucideAngularModule,
    MonthSwitcher,
  ],
  templateUrl: './planning-page.html',
  styleUrls: ['../../list-page.scss', './planning-page.scss'],
})
export class PlanningPage implements OnInit {
  private readonly planningService = inject(PlanningService);
  private readonly monthlyPlanningService = inject(MonthlyPlanningService);
  private readonly monthlyLimitService = inject(MonthlyLimitService);
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  private readonly today = new Date();
  readonly month = signal(this.today.getMonth() + 1);
  readonly year = signal(this.today.getFullYear());

  readonly categories = signal<Category[]>([]);

  readonly summary = signal<PlanningSummary | null>(null);
  readonly summaryLoading = signal(true);
  readonly summaryError = signal<string | null>(null);
  readonly hasLimit = computed(() => this.summary()?.monthlyLimit != null);

  private readonly pageNumber = signal(0);
  private readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly planningPage = signal<Page<MonthlyPlanningItem> | null>(null);
  readonly tableLoading = signal(true);
  readonly tableError = signal<string | null>(null);

  readonly expensesByCategory = signal<CategoryExpense[]>([]);
  readonly categoryChartLoading = signal(true);
  readonly categoryChartError = signal<string | null>(null);

  readonly evolution = signal<ExpenseEvolutionPoint[]>([]);
  readonly evolutionLoading = signal(true);
  readonly evolutionError = signal<string | null>(null);

  readonly currentLimit = signal<MonthlyLimit | null>(null);
  readonly limitModalOpen = signal(false);
  readonly limitSaving = signal(false);
  readonly limitError = signal<string | null>(null);

  readonly planningModalOpen = signal(false);
  readonly editingPlanning = signal<MonthlyPlanningItem | null>(null);
  readonly planningSaving = signal(false);
  readonly planningSaveError = signal<string | null>(null);

  readonly planningPendingDelete = signal<MonthlyPlanningItem | null>(null);

  readonly copying = signal(false);
  readonly copyPreview = signal<CopyPreview | null>(null);
  readonly copyPending = computed(() => this.copyPreview() !== null);
  readonly copyDialogMessage = computed(() => {
    const preview = this.copyPreview();
    if (!preview) {
      return '';
    }
    const parts: string[] = [];
    if (preview.limitAmount != null) {
      parts.push(`definir o limite mensal em ${formatBRL(preview.limitAmount)}`);
    }
    if (preview.items.length > 0) {
      const noun = preview.items.length === 1 ? 'planejamento de categoria' : 'planejamentos de categoria';
      const verb = preview.items.length === 1 ? 'existe' : 'existem';
      parts.push(`adicionar ${preview.items.length} ${noun} que ainda não ${verb} neste mês`);
    }
    return `Isso vai ${parts.join(' e ')}, com base em ${monthYearLabel(preview.month, preview.year)}.`;
  });

  readonly tipDismissed = signal(localStorage.getItem(TIP_DISMISSED_KEY) === 'true');

  dismissTip(): void {
    this.tipDismissed.set(true);
    localStorage.setItem(TIP_DISMISSED_KEY, 'true');
  }

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.notificationService.error('Não foi possível carregar as categorias.'),
    });
    this.loadAll();
  }

  onPeriodChange(period: MonthPeriod): void {
    this.month.set(period.month);
    this.year.set(period.year);
    this.pageNumber.set(0);
    this.loadAll();
  }

  onTablePageChange(page: number): void {
    this.pageNumber.set(page);
    this.loadTable();
  }

  onTableSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(0);
    this.loadTable();
  }

  openLimitModal(): void {
    this.limitError.set(null);
    this.limitModalOpen.set(true);
  }

  closeLimitModal(): void {
    this.limitModalOpen.set(false);
  }

  saveLimit(request: MonthlyLimitRequest): void {
    this.limitSaving.set(true);
    this.limitError.set(null);
    const current = this.currentLimit();
    const operation = current
      ? this.monthlyLimitService.update(current.id, request)
      : this.monthlyLimitService.create(request);

    operation.subscribe({
      next: () => {
        this.limitSaving.set(false);
        this.limitModalOpen.set(false);
        this.notificationService.success(current ? 'Limite atualizado com sucesso.' : 'Limite definido com sucesso.');
        this.loadLimit();
        this.loadSummary();
        this.loadEvolution();
      },
      error: (err: unknown) => {
        this.limitSaving.set(false);
        this.limitError.set(getErrorDetail(err));
      },
    });
  }

  openCreatePlanning(): void {
    this.editingPlanning.set(null);
    this.planningSaveError.set(null);
    this.planningModalOpen.set(true);
  }

  openEditPlanning(item: MonthlyPlanningItem): void {
    this.editingPlanning.set(item);
    this.planningSaveError.set(null);
    this.planningModalOpen.set(true);
  }

  closePlanningModal(): void {
    this.planningModalOpen.set(false);
  }

  savePlanning(request: MonthlyPlanningRequest): void {
    this.planningSaving.set(true);
    this.planningSaveError.set(null);
    const editing = this.editingPlanning();
    const operation = editing
      ? this.monthlyPlanningService.update(editing.id, request)
      : this.monthlyPlanningService.create(request);

    operation.subscribe({
      next: () => {
        this.planningSaving.set(false);
        this.planningModalOpen.set(false);
        this.notificationService.success(
          editing ? 'Planejamento atualizado com sucesso.' : 'Planejamento adicionado com sucesso.',
        );
        this.loadTable();
        this.loadSummary();
      },
      error: (err: unknown) => {
        this.planningSaving.set(false);
        this.planningSaveError.set(getErrorDetail(err));
      },
    });
  }

  requestCopyFromPreviousMonth(): void {
    const previous = this.previousPeriod();

    forkJoin({
      limit: this.monthlyLimitService.getByPeriod(previous.month, previous.year),
      previousItems: this.monthlyPlanningService.list({
        month: previous.month,
        year: previous.year,
        page: 0,
        size: COPY_FETCH_SIZE,
      }),
      currentItems: this.monthlyPlanningService.list({
        month: this.month(),
        year: this.year(),
        page: 0,
        size: COPY_FETCH_SIZE,
      }),
    }).subscribe({
      next: ({ limit, previousItems, currentItems }) => {
        const existingCategoryIds = new Set(currentItems.content.map((item) => item.category.id));
        const items = previousItems.content
          .filter((item) => !existingCategoryIds.has(item.category.id))
          .map((item) => ({ categoryId: item.category.id, amount: item.plannedAmount }));

        if (limit == null && items.length === 0) {
          this.notificationService.info(
            `Não há planejamento em ${monthYearLabel(previous.month, previous.year)} para copiar.`,
          );
          return;
        }

        this.copyPreview.set({ month: previous.month, year: previous.year, limitAmount: limit?.amount ?? null, items });
      },
      error: (err: unknown) => this.notificationService.error(getErrorDetail(err)),
    });
  }

  cancelCopy(): void {
    this.copyPreview.set(null);
  }

  confirmCopy(): void {
    const preview = this.copyPreview();
    if (!preview) {
      return;
    }
    this.copying.set(true);

    const requests: Observable<unknown>[] = [];

    if (preview.limitAmount != null) {
      const request: MonthlyLimitRequest = { month: this.month(), year: this.year(), amount: preview.limitAmount };
      const current = this.currentLimit();
      requests.push(current ? this.monthlyLimitService.update(current.id, request) : this.monthlyLimitService.create(request));
    }

    for (const item of preview.items) {
      requests.push(
        this.monthlyPlanningService.create({
          categoryId: item.categoryId,
          month: this.month(),
          year: this.year(),
          amount: item.amount,
        }),
      );
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.copying.set(false);
        this.copyPreview.set(null);
        this.notificationService.success('Planejamento copiado com sucesso.');
        this.loadAll();
      },
      error: (err: unknown) => {
        this.copying.set(false);
        this.copyPreview.set(null);
        this.notificationService.error(getErrorDetail(err));
        this.loadAll();
      },
    });
  }

  private previousPeriod(): { month: number; year: number } {
    const date = new Date(this.year(), this.month() - 2, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  requestDeletePlanning(item: MonthlyPlanningItem): void {
    this.planningPendingDelete.set(item);
  }

  cancelDeletePlanning(): void {
    this.planningPendingDelete.set(null);
  }

  confirmDeletePlanning(): void {
    const item = this.planningPendingDelete();
    if (!item) {
      return;
    }
    this.monthlyPlanningService.delete(item.id).subscribe({
      next: () => {
        this.planningPendingDelete.set(null);
        this.notificationService.success('Planejamento excluído com sucesso.');
        const page = this.planningPage();
        if (page && page.content.length === 1 && this.pageNumber() > 0) {
          this.pageNumber.set(this.pageNumber() - 1);
        }
        this.loadTable();
        this.loadSummary();
      },
      error: (err: unknown) => {
        this.planningPendingDelete.set(null);
        this.notificationService.error(getErrorDetail(err));
      },
    });
  }

  private loadAll(): void {
    this.loadSummary();
    this.loadLimit();
    this.loadTable();
    this.loadExpensesByCategory();
    this.loadEvolution();
  }

  private loadSummary(): void {
    this.summaryLoading.set(true);
    this.summaryError.set(null);
    this.planningService.getSummary(this.month(), this.year()).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.summaryLoading.set(false);
      },
      error: (err: unknown) => {
        this.summaryError.set(getErrorDetail(err));
        this.summaryLoading.set(false);
      },
    });
  }

  private loadLimit(): void {
    this.monthlyLimitService.getByPeriod(this.month(), this.year()).subscribe({
      next: (limit) => this.currentLimit.set(limit),
      error: () => this.currentLimit.set(null),
    });
  }

  private loadTable(): void {
    this.tableLoading.set(true);
    this.tableError.set(null);
    this.monthlyPlanningService
      .list({ month: this.month(), year: this.year(), page: this.pageNumber(), size: this.pageSize() })
      .subscribe({
        next: (page) => {
          this.planningPage.set(page);
          this.tableLoading.set(false);
        },
        error: (err: unknown) => {
          this.tableError.set(getErrorDetail(err));
          this.tableLoading.set(false);
        },
      });
  }

  private loadExpensesByCategory(): void {
    this.categoryChartLoading.set(true);
    this.categoryChartError.set(null);
    this.planningService.getExpensesByCategory(this.month(), this.year()).subscribe({
      next: (data) => {
        this.expensesByCategory.set(data);
        this.categoryChartLoading.set(false);
      },
      error: (err: unknown) => {
        this.categoryChartError.set(getErrorDetail(err));
        this.categoryChartLoading.set(false);
      },
    });
  }

  private loadEvolution(): void {
    this.evolutionLoading.set(true);
    this.evolutionError.set(null);
    this.planningService.getExpenseEvolution(this.month(), this.year()).subscribe({
      next: (data) => {
        this.evolution.set(data);
        this.evolutionLoading.set(false);
      },
      error: (err: unknown) => {
        this.evolutionError.set(getErrorDetail(err));
        this.evolutionLoading.set(false);
      },
    });
  }
}
