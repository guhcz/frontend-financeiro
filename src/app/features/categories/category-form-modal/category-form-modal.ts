import { Component, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryRequest } from '../../../core/models/category.model';
import { Modal } from '../../../shared/modal/modal';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

@Component({
  selector: 'app-category-form-modal',
  imports: [ReactiveFormsModule, Modal],
  templateUrl: './category-form-modal.html',
  styleUrl: './category-form-modal.scss',
})
export class CategoryFormModal {
  private readonly fb = inject(FormBuilder);

  category = input<Category | null>(null);
  saving = input(false);
  errorMessage = input<string | null>(null);

  save = output<CategoryRequest>();
  closed = output<void>();

  readonly isEditMode = computed(() => !!this.category());
  readonly title = computed(() => (this.isEditMode() ? 'Editar categoria' : 'Nova categoria'));

  readonly form = this.fb.nonNullable.group({
    name: [this.category()?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    color: [this.category()?.color ?? '#2563EB', [Validators.required, Validators.pattern(HEX_COLOR_PATTERN)]],
    icon: [this.category()?.icon ?? '', [Validators.maxLength(50)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, color, icon } = this.form.getRawValue();
    this.save.emit({ name, color, icon: icon || null });
  }
}
