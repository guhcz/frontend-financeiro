import { Component, OnInit, inject, signal } from '@angular/core';
import { Category, CategoryFilters, CategoryRequest } from '../../../core/models/category.model';
import { Page } from '../../../core/models/page.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { Pagination } from '../../../shared/pagination/pagination';
import { CategoryFormModal } from '../category-form-modal/category-form-modal';

const DEFAULT_SIZE = 10;

@Component({
  selector: 'app-category-list',
  imports: [EmptyState, ConfirmDialog, CategoryFormModal, Pagination],
  templateUrl: './category-list.html',
  styleUrls: ['../../list-page.scss', './category-list.scss'],
})
export class CategoryList implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly pageData = signal<Page<Category> | null>(null);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);

  readonly modalOpen = signal(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly categoryPendingDelete = signal<Category | null>(null);
  readonly deleteError = signal<string | null>(null);

  private filters: CategoryFilters = { page: 0, size: DEFAULT_SIZE };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.categoryService.listPage(this.filters).subscribe({
      next: (page) => {
        this.pageData.set(page);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.listError.set(getErrorDetail(err));
        this.loading.set(false);
      },
    });
  }

  onPageChange(page: number): void {
    this.filters = { ...this.filters, page };
    this.load();
  }

  onSizeChange(size: number): void {
    this.filters = { ...this.filters, size, page: 0 };
    this.load();
  }

  openCreate(): void {
    this.editingCategory.set(null);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(category: Category): void {
    this.editingCategory.set(category);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(request: CategoryRequest): void {
    this.saving.set(true);
    this.saveError.set(null);
    const editing = this.editingCategory();

    const operation = editing
      ? this.categoryService.update(editing.id, request)
      : this.categoryService.create(request);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.notificationService.success(editing ? 'Categoria atualizada.' : 'Categoria criada.');
        this.load();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.saveError.set(getErrorDetail(err));
      },
    });
  }

  requestDelete(category: Category): void {
    this.deleteError.set(null);
    this.categoryPendingDelete.set(category);
  }

  cancelDelete(): void {
    this.categoryPendingDelete.set(null);
  }

  confirmDelete(): void {
    const category = this.categoryPendingDelete();
    if (!category) {
      return;
    }
    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.categoryPendingDelete.set(null);
        this.notificationService.success('Categoria excluída.');
        const page = this.pageData();
        if (page && page.content.length === 1 && this.filters.page && this.filters.page > 0) {
          this.filters = { ...this.filters, page: this.filters.page - 1 };
        }
        this.load();
      },
      error: (err: unknown) => {
        this.categoryPendingDelete.set(null);
        this.deleteError.set(getErrorDetail(err));
      },
    });
  }
}
