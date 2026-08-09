import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
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
import { MonthlyLimitFormModal } from '../../monthly-limits/monthly-limit-form-modal/monthly-limit-form-modal';
import { ExpenseEvolutionChart } from '../expense-evolution-chart/expense-evolution-chart';
import { ExpensesByCategoryChart } from '../expenses-by-category-chart/expenses-by-category-chart';
import { MonthlyPlanningFormModal } from '../monthly-planning-form-modal/monthly-planning-form-modal';
import { MonthlyPlanningTable } from '../monthly-planning-table/monthly-planning-table';
import { PlanningSummaryCards } from '../planning-summary-cards/planning-summary-cards';

const DEFAULT_PAGE_SIZE = 5;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
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

  readonly periodValue = computed(() => `${this.year()}-${pad2(this.month())}`);

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

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.notificationService.error('Não foi possível carregar as categorias.'),
    });
    this.loadAll();
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      return;
    }
    const [y, m] = value.split('-').map(Number);
    this.month.set(m);
    this.year.set(y);
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
