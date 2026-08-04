import { Component, OnInit, inject, signal } from '@angular/core';
import { Category, CategoryRequest } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorDetail } from '../../../core/utils/http-error.util';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { CategoryFormModal } from '../category-form-modal/category-form-modal';

@Component({
  selector: 'app-category-list',
  imports: [EmptyState, ConfirmDialog, CategoryFormModal],
  templateUrl: './category-list.html',
  styleUrls: ['../../list-page.scss', './category-list.scss'],
})
export class CategoryList implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly listError = signal<string | null>(null);

  readonly modalOpen = signal(false);
  readonly editingCategory = signal<Category | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);

  readonly categoryPendingDelete = signal<Category | null>(null);
  readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.categoryService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.listError.set(getErrorDetail(err));
        this.loading.set(false);
      },
    });
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
        this.load();
      },
      error: (err: unknown) => {
        this.categoryPendingDelete.set(null);
        this.deleteError.set(getErrorDetail(err));
      },
    });
  }
}
